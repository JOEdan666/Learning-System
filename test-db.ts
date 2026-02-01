import { PrismaClient } from './app/generated/prisma'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.conversation.count()
    fs.writeFileSync('db-result.txt', `Success: ${count}`)
  } catch (e) {
    fs.writeFileSync('db-result.txt', `Error: ${e}`)
  } finally {
    await prisma.$disconnect()
  }
}

main()