import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding initial sample records into Supabase PostgreSQL...')

  await prisma.product.deleteMany({})

  // 1. Products
  const productsData = [
    {
      id: 'prod-101',
      serialNumber: 'SN-1001',
      name: 'Refined Hydrated Lime (92%+ Purity)',
      slug: 'hydrated-lime-101',
      purchasePrice: 42,
      unit: 'Kg',
      inventoryStock: 850,
      sellingPrice: 55,
      gstRate: 18,
      inStock: true,
    },
    {
      id: 'prod-102',
      serialNumber: 'SN-1002',
      name: 'Industrial Grade Soda Ash Dense',
      slug: 'soda-ash-102',
      purchasePrice: 16500,
      unit: 'Metric Ton',
      inventoryStock: 120,
      sellingPrice: 21000,
      gstRate: 18,
      inStock: true,
    },
    {
      id: 'prod-103',
      serialNumber: 'SN-1003',
      name: 'Polypropylene Woven Jumbo Bags (1 Ton)',
      slug: 'woven-bags-103',
      purchasePrice: 280,
      unit: 'Piece',
      inventoryStock: 1500,
      sellingPrice: 350,
      gstRate: 5,
      inStock: true,
    },
  ]

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    })
  }
  console.log('✓ Products seeded')

  // 2. Customers
  const customersData = [
    {
      id: 'CUST-101',
      name: 'Rajesh Mehta',
      mobileNumber: '+91 98250 12345',
      billingAddress: 'Plot 42, GIDC Industrial Estate, Sachin, Surat, Gujarat - 394230',
      creditLimitDays: 30,
      status: 'ACTIVE',
    },
    {
      id: 'CUST-102',
      name: 'Suresh Patel',
      mobileNumber: '+91 99090 67890',
      billingAddress: '102 Harmony Complex, Ring Road, Ahmedabad, Gujarat - 380009',
      creditLimitDays: 45,
      status: 'ACTIVE',
    },
  ]

  for (const c of customersData) {
    await (prisma as any).customer.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    })
  }
  console.log('✓ Customers seeded')

  // 3. DeptAccounts
  const dept1 = await (prisma as any).deptAccount.upsert({
    where: { id: 'DEBT - 01' },
    update: {
      customerName: 'Rajesh Mehta (Mehta Chemical Industries)',
      mobileNumber: '+91 98250 12345',
      billingAddress: 'Plot 42, GIDC Industrial Area, Sachin, Surat - 394230',
      creditLimitDays: 30,
      totalDebtAmount: 75000,
      totalPaidAmount: 30000,
      balanceDue: 45000,
      status: 'ACTIVE',
    },
    create: {
      id: 'DEBT - 01',
      customerName: 'Rajesh Mehta (Mehta Chemical Industries)',
      mobileNumber: '+91 98250 12345',
      billingAddress: 'Plot 42, GIDC Industrial Area, Sachin, Surat - 394230',
      creditLimitDays: 30,
      totalDebtAmount: 75000,
      totalPaidAmount: 30000,
      balanceDue: 45000,
      status: 'ACTIVE',
    },
  })

  // Seed sample transactions for DEBT - 01
  await (prisma as any).debtTransaction.upsert({
    where: { id: 'TXN-9001' },
    update: {
      deptAccountId: dept1.id,
      billNumber: 'INV-2026-001',
      date: new Date('2026-08-25'),
      itemsSummary: 'Hydrated Lime (500 Kg @ ₹55/Kg)',
      billAmount: 27500,
      paidAmount: 27500,
      balanceAmount: 0,
      paymentStatus: 'PAID',
    },
    create: {
      id: 'TXN-9001',
      deptAccountId: dept1.id,
      billNumber: 'INV-2026-001',
      date: new Date('2026-08-25'),
      itemsSummary: 'Hydrated Lime (500 Kg @ ₹55/Kg)',
      billAmount: 27500,
      paidAmount: 27500,
      balanceAmount: 0,
      paymentStatus: 'PAID',
    },
  })

  await (prisma as any).debtTransaction.upsert({
    where: { id: 'TXN-9002' },
    update: {
      deptAccountId: dept1.id,
      billNumber: 'INV-2026-008',
      date: new Date('2026-09-01'),
      itemsSummary: 'Soda Ash Dense (2 MT @ ₹21,000/MT) + Bags',
      billAmount: 47500,
      paidAmount: 2500,
      balanceAmount: 45000,
      paymentStatus: 'PARTIAL',
    },
    create: {
      id: 'TXN-9002',
      deptAccountId: dept1.id,
      billNumber: 'INV-2026-008',
      date: new Date('2026-09-01'),
      itemsSummary: 'Soda Ash Dense (2 MT @ ₹21,000/MT) + Bags',
      billAmount: 47500,
      paidAmount: 2500,
      balanceAmount: 45000,
      paymentStatus: 'PARTIAL',
    },
  })

  const dept2 = await (prisma as any).deptAccount.upsert({
    where: { id: 'DEBT - 02' },
    update: {
      customerName: 'Suresh Patel (Patel Agri Commodities)',
      mobileNumber: '+91 99090 67890',
      billingAddress: '102 Harmony Complex, Ring Road, Ahmedabad - 380009',
      creditLimitDays: 45,
      totalDebtAmount: 120000,
      totalPaidAmount: 120000,
      balanceDue: 0,
      status: 'ACTIVE',
    },
    create: {
      id: 'DEBT - 02',
      customerName: 'Suresh Patel (Patel Agri Commodities)',
      mobileNumber: '+91 99090 67890',
      billingAddress: '102 Harmony Complex, Ring Road, Ahmedabad - 380009',
      creditLimitDays: 45,
      totalDebtAmount: 120000,
      totalPaidAmount: 120000,
      balanceDue: 0,
      status: 'ACTIVE',
    },
  })

  await (prisma as any).debtTransaction.upsert({
    where: { id: 'TXN-9003' },
    update: {
      deptAccountId: dept2.id,
      billNumber: 'INV-2026-003',
      date: new Date('2026-08-28'),
      itemsSummary: 'Soda Ash Dense (5 MT @ ₹24,000/MT)',
      billAmount: 120000,
      paidAmount: 120000,
      balanceAmount: 0,
      paymentStatus: 'PAID',
    },
    create: {
      id: 'TXN-9003',
      deptAccountId: dept2.id,
      billNumber: 'INV-2026-003',
      date: new Date('2026-08-28'),
      itemsSummary: 'Soda Ash Dense (5 MT @ ₹24,000/MT)',
      billAmount: 120000,
      paidAmount: 120000,
      balanceAmount: 0,
      paymentStatus: 'PAID',
    },
  })
  console.log('✓ Debt accounts & transactions seeded')

  // 4. Vendors
  const vendorsData = [
    {
      id: 'VEN-01',
      vendorCode: 'VEN-01',
      name: 'Gujarat Chemicals & Minerals Corp',
      category: 'Industrial Chemicals & Minerals',
      contactPerson: 'Kishorebhai Patel',
      phone: '+91 98250 11223',
      city: 'Ahmedabad, Gujarat',
      status: 'ACTIVE',
    },
    {
      id: 'VEN-02',
      vendorCode: 'VEN-02',
      name: 'Saurashtra Lime & Gypsum Mines',
      category: 'Industrial Chemicals & Minerals',
      contactPerson: 'Ramesh Sundaram',
      phone: '+91 99090 44556',
      city: 'Porbandar, Gujarat',
      status: 'ACTIVE',
    },
  ]

  for (const v of vendorsData) {
    await (prisma as any).vendor.upsert({
      where: { id: v.id },
      update: v,
      create: v,
    })
  }
  console.log('✓ Vendors seeded')

  // 5. Purchases
  const purchasesData = [
    {
      id: 'PO-2026-101',
      orderNumber: 'PO-2026-101',
      vendor: 'Gujarat Chemicals & Minerals Corp',
      item: 'Raw Soda Ash Boulders',
      quantity: 50,
      totalAmount: 450000,
      date: new Date('2026-09-03'),
      status: 'DELIVERED',
    },
    {
      id: 'PO-2026-102',
      orderNumber: 'PO-2026-102',
      vendor: 'Saurashtra Lime & Gypsum Mines',
      item: 'Refined Calcium Lime',
      quantity: 100,
      totalAmount: 180000,
      date: new Date('2026-09-03'),
      status: 'DELIVERED',
    },
  ]

  for (const po of purchasesData) {
    await (prisma as any).purchaseOrder.upsert({
      where: { id: po.id },
      update: po,
      create: po,
    })
  }
  console.log('✓ Purchase orders seeded')

  // 6. Bills
  const billsData = [
    {
      id: 'INV-2026-101',
      billNumber: 'INV-2026-101',
      customer: 'Rajesh Mehta (Mehta Chemical Industries)',
      date: new Date('2026-09-03'),
      amount: 45000,
      paidAmount: 45000,
      balanceAmount: 0,
      status: 'PAID',
    },
    {
      id: 'INV-2026-102',
      billNumber: 'INV-2026-102',
      customer: 'Suresh Patel (Patel Agri Commodities)',
      date: new Date('2026-09-03'),
      amount: 105000,
      paidAmount: 50000,
      balanceAmount: 55000,
      status: 'PARTIAL',
    },
  ]

  for (const b of billsData) {
    await (prisma as any).bill.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    })
  }
  console.log('✓ Bills seeded')

  // 7. Quotations
  const quotesData = [
    {
      id: 'RFQ-8001',
      clientName: 'Rajesh Mehta',
      companyName: 'Mehta Chemical Industries',
      email: 'rajesh@mehtachemicals.com',
      phone: '+91 98250 12345',
      productName: 'Soda Ash Dense (Light Grade)',
      quantity: 50,
      unit: 'Metric Ton',
      deliveryLocation: 'Mundra Port, Gujarat',
      status: 'PENDING',
    },
    {
      id: 'RFQ-8002',
      clientName: 'Suresh Patel',
      companyName: 'Patel Agri Commodities',
      email: 'suresh@patelagri.com',
      phone: '+91 99090 67890',
      productName: 'PP Woven Jumbo Bags (1 MT)',
      quantity: 500,
      unit: 'Piece',
      deliveryLocation: 'Kandla Port, Gujarat',
      status: 'QUOTED',
    },
  ]

  for (const q of quotesData) {
    await (prisma as any).quoteRequest.upsert({
      where: { id: q.id },
      update: q,
      create: q,
    })
  }
  console.log('✓ Quotations seeded')

  console.log('All sample records successfully populated in Supabase PostgreSQL!')
}

main()
  .catch((err) => {
    console.error('Seeding error:', err)
  })
  .finally(() => prisma.$disconnect())
