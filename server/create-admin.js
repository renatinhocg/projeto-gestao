const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createAdminUser() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10)

        const user = await prisma.user.create({
            data: {
                email: 'admin@admin.com',
                name: 'Admin User',
                password: hashedPassword,
                isAdmin: true,
                photoUrl: null
            }
        })

        console.log('✅ Admin user created successfully!')
        console.log('Email:', user.email)
        console.log('Password: admin123')
        console.log('Name:', user.name)
    } catch (error) {
        console.error('Error creating admin user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createAdminUser()
