import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const payments = await (prisma as any).debtPayment.findMany({
      where: { deptAccountId: id },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ success: true, data: payments })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment logs for customer' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const body = await request.json()
    const { date, paymentType, amount, note, targetBillNo } = body

    const pAmount = parseFloat(amount) || 0
    if (pAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required.' },
        { status: 400 }
      )
    }

    // Find the debt account and its transactions
    const account = await (prisma as any).deptAccount.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Debt customer account not found.' },
        { status: 404 }
      )
    }

    let remainingToAllocate = pAmount
    let appliedBillStr = ''
    const updatedTxns: any[] = []

    // If targetBillNo is provided, reduce that specific bill first
    if (targetBillNo) {
      const specificTxn = account.transactions.find((t: any) => t.billNumber === targetBillNo)
      if (specificTxn) {
        const curBal = specificTxn.balanceAmount || Math.max(0, (specificTxn.billAmount || 0) - (specificTxn.paidAmount || 0))
        const reduceAmt = Math.min(remainingToAllocate, curBal)
        const newPaid = (specificTxn.paidAmount || 0) + reduceAmt
        const newBal = Math.max(0, (specificTxn.billAmount || 0) - newPaid)
        const newStatus = newBal === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING'

        await (prisma as any).debtTransaction.update({
          where: { id: specificTxn.id },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBal,
            paymentStatus: newStatus,
          },
        })

        remainingToAllocate -= reduceAmt
        appliedBillStr = `Bill #${specificTxn.billNumber} (₹${reduceAmt.toLocaleString()} reduced)`
      }
    }

    // If there is still payment amount left to allocate, apply FIFO to remaining unpaid transactions
    if (remainingToAllocate > 0) {
      const unpaidTxns = account.transactions.filter((t: any) => t.billNumber !== targetBillNo && (t.balanceAmount > 0 || t.paymentStatus !== 'PAID'))
      
      const appliedBills: string[] = appliedBillStr ? [appliedBillStr] : []

      for (const txn of unpaidTxns) {
        if (remainingToAllocate <= 0) break

        const curBal = txn.balanceAmount || Math.max(0, (txn.billAmount || 0) - (txn.paidAmount || 0))
        if (curBal <= 0) continue

        const reduceAmt = Math.min(remainingToAllocate, curBal)
        const newPaid = (txn.paidAmount || 0) + reduceAmt
        const newBal = Math.max(0, (txn.billAmount || 0) - newPaid)
        const newStatus = newBal === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING'

        await (prisma as any).debtTransaction.update({
          where: { id: txn.id },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBal,
            paymentStatus: newStatus,
          },
        })

        remainingToAllocate -= reduceAmt
        appliedBills.push(`Bill #${txn.billNumber} (₹${reduceAmt.toLocaleString()} reduced)`)
      }

      appliedBillStr = appliedBills.join(', ')
    }

    if (!appliedBillStr) {
      appliedBillStr = 'Account Balance Credit'
    }

    // Create the DebtPayment log
    const paymentLog = await (prisma as any).debtPayment.create({
      data: {
        deptAccountId: id,
        date: date ? new Date(date) : new Date(),
        paymentType: paymentType || 'CASH',
        amount: pAmount,
        note: note || '',
        appliedBillNo: appliedBillStr,
      },
    })

    // Recalculate DeptAccount overall totals
    const allTxns = await (prisma as any).debtTransaction.findMany({
      where: { deptAccountId: id },
    })
    const allPayments = await (prisma as any).debtPayment.findMany({
      where: { deptAccountId: id },
    })

    const totalDebtAmount = allTxns.reduce((acc: number, t: any) => acc + (t.billAmount || 0), 0)
    const totalPaidAmount = allPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0)
    const balanceDue = Math.max(0, totalDebtAmount - totalPaidAmount)

    let updatedAccount
    try {
      updatedAccount = await (prisma as any).deptAccount.update({
        where: { id },
        data: {
          totalDebtAmount,
          totalPaidAmount,
          balanceDue,
        },
        include: {
          transactions: { orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { date: 'desc' } },
        },
      })
    } catch (e) {
      updatedAccount = await (prisma as any).deptAccount.update({
        where: { id },
        data: {
          totalDebtAmount,
          totalPaidAmount,
          balanceDue,
        },
        include: {
          transactions: { orderBy: { createdAt: 'desc' } },
        },
      })
      if (updatedAccount) {
        updatedAccount = { ...updatedAccount, payments: allPayments }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: paymentLog,
        account: updatedAccount,
        message: `Payment of ₹${pAmount.toLocaleString()} received and logged successfully!`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error recording debt payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    )
  }
}
