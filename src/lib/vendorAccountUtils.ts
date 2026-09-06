import { PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '@/lib/prisma'

function getDb(): any {
  return (defaultPrisma as any).vendorAccount ? defaultPrisma : new PrismaClient()
}

export async function recalculateVendorAccountLedger(vendorAccountId: string) {
  try {
    const prisma = getDb()
    const account = await prisma.vendorAccount.findUnique({

      where: { id: vendorAccountId },
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

    let txns = account.transactions || []
    let payments = account.payments || []

    // Auto-heal missing payment logs for transactions created with initial paidAmount
    const txnsWithInitialPaid = txns.filter((t: any) => (t.paidAmount || 0) > 0)
    const totalInitialTxnPaid = txnsWithInitialPaid.reduce((sum: number, t: any) => sum + (t.paidAmount || 0), 0)

    if (payments.length === 0 && totalInitialTxnPaid > 0) {
      for (const t of txnsWithInitialPaid) {
        try {
          const newPayment = await (prisma as any).vendorDebtPayment.create({
            data: {
              vendorAccountId,
              date: t.date ? new Date(t.date) : new Date(),
              paymentType: 'CASH',
              amount: t.paidAmount,
              note: 'Initial payment logged during purchase order',
              appliedBillNo: `PO #${t.billNumber}`,
            },
          })
          payments.push(newPayment)
        } catch (e) {
          console.warn('Failed to auto-heal vendor payment log:', e)
        }
      }
    }

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
        const match = p.appliedBillNo.match(/PO-[A-Za-z0-9-]+/i) || p.appliedBillNo.match(/BILL-[A-Za-z0-9-]+/i)
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

    // Step C: Update transaction in DB if allocation changed
    for (const t of txns) {
      const paid = txnAllocations[t.id] || 0
      const bal = Math.max(0, t.billAmount - paid)
      const status = (bal === 0 && t.billAmount > 0) ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')

      if (t.paidAmount !== paid || t.balanceAmount !== bal || t.paymentStatus !== status) {
        await (prisma as any).vendorDebtTransaction.update({
          where: { id: t.id },
          data: {
            paidAmount: paid,
            balanceAmount: bal,
            paymentStatus: status,
          },
        })
        t.paidAmount = paid
        t.balanceAmount = bal
        t.paymentStatus = status
      }
    }

    // Step D: Update VendorAccount totals
    if (
      account.totalDebtAmount !== totalDebtAmount ||
      account.totalPaidAmount !== totalPaidAmount ||
      account.balanceDue !== balanceDue
    ) {
      const updatedAccount = await (prisma as any).vendorAccount.update({
        where: { id: vendorAccountId },
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
    }

    return {
      ...account,
      totalDebtAmount,
      totalPaidAmount,
      balanceDue,
      transactions: [...txns].reverse(),
      payments: [...payments].reverse(),
    }
  } catch (err) {
    console.error('Error recalculating vendor account ledger:', err)
    return null
  }
}
