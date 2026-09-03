import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resetting Hetal Trading Company database...')

  // Clean existing dummy records
  await prisma.quoteRequest.deleteMany({})
  await prisma.inquiry.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  console.log('Database clean slate ready for real data entry!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
