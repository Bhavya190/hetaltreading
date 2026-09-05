import { prisma } from '@/lib/prisma'

export async function recalculateDeptAccountLedger(deptAccountId: string) {
  try {
    const account = await (prisma as any).deptAccount.findUnique({
      where: { id: deptAccountId },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
        payments: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!account) return null

    const txns = account.transactions || []
    const payments = account.payments || []

    const totalDebtAmount = txns.reduce((sum: number, t: any) => sum + (t.billAmount || 0), 0)
    const totalPaidAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const balanceDue = Math.max(0, totalDebtAmount - totalPaidAmount)

    // Reset allocated paid amounts for transactions
    const txnAllocations: { [txnId: string]: number } = {}
    txns.forEach((t: any) => {
      txnAllocations[t.id] = 0
    })

    // Step A: Target-allocated payments
    let unallocatedPaymentPool = 0

    payments.forEach((p: any) => {
      const pAmt = p.amount || 0
      let allocatedFromThisPayment = 0

      if (p.appliedBillNo) {
        const match = p.appliedBillNo.match(/BILL-[A-Za-z0-9-]+/i)
        const targetBillNo = match ? match[0] : null

        if (targetBillNo) {
          const targetTxn = txns.find((t: any) => t.billNumber.toLowerCase() === targetBillNo.toLowerCase())
          if (targetTxn) {
            const alreadyAllocated = txnAllocations[targetTxn.id] || 0
            const room = Math.max(0, targetTxn.billAmount - alreadyAllocated)
            const fill = Math.min(pAmt, room)
            txnAllocations[targetTxn.id] = alreadyAllocated + fill
            allocatedFromThisPayment = fill
          }
        }
      }

      unallocatedPaymentPool += Math.max(0, pAmt - allocatedFromThisPayment)
    })

    // Step B: FIFO allocation of unallocated payment pool to unpaid transactions
    for (const t of txns) {
      if (unallocatedPaymentPool <= 0) break

      const alreadyAllocated = txnAllocations[t.id] || 0
      const room = Math.max(0, t.billAmount - alreadyAllocated)
      if (room <= 0) continue

      const fill = Math.min(unallocatedPaymentPool, room)
      txnAllocations[t.id] = alreadyAllocated + fill
      unallocatedPaymentPool -= fill
    }

    // Step C: Update each transaction in DB
    for (const t of txns) {
      const paid = txnAllocations[t.id] || 0
      const bal = Math.max(0, t.billAmount - paid)
      const status = (bal === 0 && t.billAmount > 0) ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')

      await (prisma as any).debtTransaction.update({
        where: { id: t.id },
        data: {
          paidAmount: paid,
          balanceAmount: bal,
          paymentStatus: status,
        },
      })
    }

    // Step D: Update DeptAccount totals in DB
    const updatedAccount = await (prisma as any).deptAccount.update({
      where: { id: deptAccountId },
      data: {
        totalDebtAmount,
        totalPaidAmount,
        balanceDue,
      },
      include: {
        transactions: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    })

    return updatedAccount
  } catch (err) {
    console.error('Error recalculating dept account ledger:', err)
    return null
  }
}
