const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function seedDatabase() {
    try {
        const count = await User.count();
        if (count === 0) {
            console.log('User table is empty. Starting database seeding...');

            const password = process.env.PU_PASSWORD;
            const hash = await bcrypt.hash(password, 10);

            // Create Admin (no credits — admins cannot make or receive donations)
            await User.create({
                name: 'Administrador',
                email: 'admin@mail.com',
                password: hash,
                admin: true,
                credits: 0
            });

            // Create Regular User 1
            await User.create({
                name: 'Maria Silva',
                email: 'maria@mail.com',
                password: hash,
                admin: false,
                credits: 100.00
            });

            // Create Regular User 2
            await User.create({
                name: 'João Santos',
                email: 'joao@mail.com',
                password: hash,
                admin: false,
                credits: 100.00
            });

            console.log('Database seeded successfully! (1 admin + 2 regular users)');
        } else {
            console.log('Database already contains users. Skipping seed.');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

module.exports = {
    seedDatabase
};
