const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');

const User = require('../models/user');
const { seedDatabase } = require('../utils/seeder');

describe('Database Seeding Utility - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    test('should seed database with one admin and two regular users if database is empty', async () => {
        // Mock User.count to return 0
        const countMock = mock.method(User, 'count', async () => 0);
        
        // Mock User.create
        const createMock = mock.method(User, 'create', async (data) => {
            return { id: 1, ...data };
        });

        // Suppress console.log to keep test output clean
        const originalLog = console.log;
        console.log = () => {};

        try {
            await seedDatabase();
        } finally {
            console.log = originalLog;
        }

        assert.strictEqual(countMock.mock.callCount(), 1);
        assert.strictEqual(createMock.mock.callCount(), 3);

        // Verify first user created is Admin with 0 credits
        const adminCall = createMock.mock.calls[0].arguments[0];
        assert.strictEqual(adminCall.name, 'Administrador');
        assert.strictEqual(adminCall.email, 'admin@mail.com');
        assert.strictEqual(adminCall.admin, true);
        assert.strictEqual(adminCall.credits, 0);

        // Verify second user created is Regular User 1
        const user1Call = createMock.mock.calls[1].arguments[0];
        assert.strictEqual(user1Call.name, 'Maria Silva');
        assert.strictEqual(user1Call.email, 'maria@mail.com');
        assert.strictEqual(user1Call.admin, false);
        assert.strictEqual(user1Call.credits, 100.00);

        // Verify third user created is Regular User 2
        const user2Call = createMock.mock.calls[2].arguments[0];
        assert.strictEqual(user2Call.name, 'João Santos');
        assert.strictEqual(user2Call.email, 'joao@mail.com');
        assert.strictEqual(user2Call.admin, false);
        assert.strictEqual(user2Call.credits, 100.00);
    });

    test('should skip database seeding if database is not empty', async () => {
        // Mock User.count to return 3
        const countMock = mock.method(User, 'count', async () => 3);
        
        // Mock User.create
        const createMock = mock.method(User, 'create', async () => {
            return {};
        });

        const originalLog = console.log;
        console.log = () => {};

        try {
            await seedDatabase();
        } finally {
            console.log = originalLog;
        }

        assert.strictEqual(countMock.mock.callCount(), 1);
        assert.strictEqual(createMock.mock.callCount(), 0); // No user should be created
    });

    test('should handle database errors gracefully', async () => {
        mock.method(User, 'count', async () => {
            throw new Error('DB connection failed');
        });

        const originalError = console.error;
        let errorLogged = false;
        console.error = () => { errorLogged = true; };
        const originalLog = console.log;
        console.log = () => {};

        try {
            await seedDatabase(); // Should not throw
            assert.strictEqual(errorLogged, true);
        } finally {
            console.error = originalError;
            console.log = originalLog;
        }
    });
});
