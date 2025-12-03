const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

async function main() {
  const prisma = new PrismaClient()
  const email = 'admin@test.local'
  const password = 'Password123!'
  const name = 'Admin Test'
  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, isAdmin: true },
    create: { email, name, password: hashed, isAdmin: true }
  })

  console.log('User created/updated:', { id: user.id, email: user.email, name: user.name })
  console.log('Credentials:')
  console.log('  email:', email)
  console.log('  password:', password)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
