const { mock, test, describe, afterEach } = require('node:test');
const assert = require('node:assert');

const User = require('../models/user');
const Donation = require('../models/donation');
const Draw = require('../models/draw');
const sequelize = require('../database');
const donationController = require('../controllers/donationController');

// Helpers to mock Express Request and Response
function mockRequest(body = {}, userPayload = {}, query = {}, params = {}) {
    const flashMessages = {};
    return {
        body,
        query,
        params,
        user: userPayload,
        flash(key, val) {
            if (val !== undefined) {
                flashMessages[key] = val;
            } else {
                return flashMessages[key] || '';
            }
        }
    };
}

function mockResponse() {
    const res = {};
    res.redirectedTo = null;
    res.renderedTemplate = null;
    res.renderData = null;

    res.redirect = (url) => {
        res.redirectedTo = url;
        return res;
    };
    res.render = (template, data) => {
        res.renderedTemplate = template;
        res.renderData = data;
        return res;
    };
    return res;
}

describe('Donations and Credits Flow - Unit Tests', () => {

    afterEach(() => {
        mock.restoreAll();
    });

    // =========================================================
    // listDonations
    // =========================================================
    describe('listDonations', () => {
        test('should render donations list with available items', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, {});
            const res = mockResponse();
            const next = () => {};

            const userInstance = { id: 2, credits: 100.00, admin: false };
            mock.method(User, 'findByPk', async () => userInstance);
            mock.method(Donation, 'findAll', async () => [
                { id: 1, name: 'Item A', status: 'available', donor: { id: 1, name: 'Doador' } }
            ]);

            await donationController.listDonations(req, res, next);

            assert.strictEqual(res.renderedTemplate, 'doacoes');
            assert.strictEqual(res.renderData.donations.length, 1);
            assert.strictEqual(res.renderData.user, userInstance);
        });

        test('should apply category and name filters', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, { category: 'Livros', name: 'Python' }, {});
            const res = mockResponse();
            const next = () => {};

            const userInstance = { id: 2, credits: 100.00 };
            mock.method(User, 'findByPk', async () => userInstance);

            let capturedWhere = null;
            mock.method(Donation, 'findAll', async (opts) => {
                capturedWhere = opts.where;
                return [];
            });

            await donationController.listDonations(req, res, next);

            assert.strictEqual(capturedWhere.category, 'Livros');
            assert.ok(capturedWhere.name); // iLike filter applied
            assert.strictEqual(res.renderData.filters.category, 'Livros');
            assert.strictEqual(res.renderData.filters.name, 'Python');
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, {});
            const res = mockResponse();
            const dbError = new Error('DB crash');

            mock.method(Donation, 'findAll', async () => { throw dbError; });

            let nextError = null;
            const next = (err) => { nextError = err; };

            await donationController.listDonations(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });

    // =========================================================
    // registerDonationPage
    // =========================================================
    describe('registerDonationPage', () => {
        test('should block admin from accessing donation page', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => {};

            await donationController.registerDonationPage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Administradores não podem realizar doações.');
        });

        test('should render novaDoacao for regular user', async () => {
            const req = mockRequest({}, { id: 2, admin: false });
            const res = mockResponse();
            const next = () => {};

            const userInstance = { id: 2, credits: 100.00 };
            mock.method(User, 'findByPk', async () => userInstance);

            await donationController.registerDonationPage(req, res, next);

            assert.strictEqual(res.renderedTemplate, 'novaDoacao');
            assert.strictEqual(res.renderData.user, userInstance);
        });
    });

    // =========================================================
    // createDonation
    // =========================================================
    describe('createDonation', () => {
        test('should block admin from creating donations', async () => {
            const req = mockRequest({
                name: 'Monitor Dell',
                description: 'Used monitor',
                category: 'Eletrônicos',
                price: '150.00',
                photo: 'data:image/png;base64,abcdef'
            }, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => {};

            await donationController.createDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Administradores não podem realizar doações.');
        });

        test('should fail if any required field is missing', async () => {
            const req = mockRequest({ name: '', description: '', category: '', price: '', photo: '' }, { id: 1, admin: false });
            const res = mockResponse();
            const next = () => { };

            await donationController.createDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes/nova');
            assert.strictEqual(req.flash('error_msg'), 'Todos os campos são obrigatórios');
        });

        test('should fail if price is not within R$ 1.00 and R$ 500.00 range', async () => {
            const req = mockRequest({
                name: 'Monitor Dell',
                description: 'Used monitor',
                category: 'Eletrônicos',
                price: '0.50',
                photo: 'data:image/png;base64,abcdef'
            }, { id: 1, admin: false });
            const res = mockResponse();
            const next = () => { };

            await donationController.createDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes/nova');
            assert.strictEqual(req.flash('error_msg'), 'O valor deve ser entre R$ 1,00 e R$ 500,00');
        });

        test('should fail if price exceeds R$ 500.00', async () => {
            const req = mockRequest({
                name: 'Monitor Dell',
                description: 'Used monitor',
                category: 'Eletrônicos',
                price: '501.00',
                photo: 'data:image/png;base64,abcdef'
            }, { id: 1, admin: false });
            const res = mockResponse();
            const next = () => {};

            await donationController.createDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes/nova');
            assert.strictEqual(req.flash('error_msg'), 'O valor deve ser entre R$ 1,00 e R$ 500,00');
        });

        test('should fail if photo size is greater than 2MB', async () => {
            const largeBase64 = 'a'.repeat(3 * 1024 * 1024);
            const req = mockRequest({
                name: 'Monitor Dell',
                description: 'Used monitor',
                category: 'Eletrônicos',
                price: '150.00',
                photo: largeBase64
            }, { id: 1, admin: false });
            const res = mockResponse();
            const next = () => { };

            await donationController.createDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes/nova');
            assert.strictEqual(req.flash('error_msg'), 'A foto deve ter no máximo 2MB');
        });

        test('should register donation with status "registered" and redirect to history', async () => {
            const req = mockRequest({
                name: 'Monitor Dell',
                description: 'Used monitor',
                category: 'Eletrônicos',
                price: '150.00',
                photo: 'data:image/png;base64,abcdef'
            }, { id: 2, admin: false });
            const res = mockResponse();
            const next = () => { };

            const createSpy = mock.fn(async () => { });
            mock.method(Donation, 'create', createSpy);

            await donationController.createDonation(req, res, next);

            assert.strictEqual(createSpy.mock.callCount(), 1);
            const callArgs = createSpy.mock.calls[0].arguments[0];
            assert.strictEqual(callArgs.name, 'Monitor Dell');
            assert.strictEqual(callArgs.price, 150.00);
            assert.strictEqual(callArgs.userId, 2);
            assert.strictEqual(callArgs.status, 'registered');
            assert.strictEqual(res.redirectedTo, '/historico');
            assert.match(req.flash('success_msg'), /Doação cadastrada com sucesso/);
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({
                name: 'Monitor Dell',
                description: 'Used monitor',
                category: 'Eletrônicos',
                price: '150.00',
                photo: 'data:image/png;base64,abcdef'
            }, { id: 2, admin: false });
            const res = mockResponse();

            const dbError = new Error('DB write error');
            mock.method(Donation, 'create', async () => { throw dbError; });

            let nextError = null;
            const next = (err) => { nextError = err; };

            await donationController.createDonation(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });

    // =========================================================
    // claimDonation
    // =========================================================
    describe('claimDonation', () => {
        test('should block admin from claiming donations', async () => {
            const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Administradores não podem receber doações.');
        });

        test('should fail if donation does not exist', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 999 });
            const res = mockResponse();
            const next = () => { };

            mock.method(Donation, 'findByPk', async () => null);

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
        });

        test('should fail if donation is not available', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            const existingDonation = { id: 10, userId: 1, receiverId: null, status: 'pending', price: 50.00 };
            mock.method(Donation, 'findByPk', async () => existingDonation);

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Este item não está disponível para resgate');
        });

        test('should fail if user attempts to claim their own donation', async () => {
            const req = mockRequest({}, { id: 1, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            const existingDonation = { id: 10, userId: 1, receiverId: null, status: 'available', price: 50.00 };
            mock.method(Donation, 'findByPk', async () => existingDonation);

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Você não pode receber seu próprio item');
        });

        test('should fail if user has insufficient credits', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            const existingDonation = { id: 10, userId: 1, receiverId: null, status: 'available', price: 150.00 };
            mock.method(Donation, 'findByPk', async () => existingDonation);

            const userInstance = { id: 2, credits: 100.00 };
            mock.method(User, 'findByPk', async () => userInstance);

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Saldo de créditos insuficiente');
        });

        test('should successfully claim donation, debiting receiver and crediting donor', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            const donationInstance = { id: 10, userId: 1, receiverId: null, status: 'available', price: 50.00, save: mock.fn(async () => { }) };
            const donorInstance = { id: 1, name: 'Doador', credits: 100.00, save: mock.fn(async () => { }) };
            const receiverInstance = { id: 2, name: 'Recebedor', credits: 100.00, save: mock.fn(async () => { }) };

            mock.method(Donation, 'findByPk', async (id) => {
                if (id == 10) return donationInstance;
                return null;
            });

            mock.method(User, 'findByPk', async (id) => {
                if (id == 1) return donorInstance;
                if (id == 2) return receiverInstance;
                return null;
            });

            const transactionMock = {
                commit: mock.fn(async () => { }),
                rollback: mock.fn(async () => { })
            };
            mock.method(sequelize, 'transaction', async () => transactionMock);

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(receiverInstance.credits, 50.00);
            assert.strictEqual(donorInstance.credits, 150.00);
            assert.strictEqual(donationInstance.receiverId, 2);
            assert.strictEqual(donationInstance.status, 'pending');
            assert.strictEqual(transactionMock.commit.mock.callCount(), 1);
            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.match(req.flash('success_msg'), /Doação reservada com sucesso/);
        });

        test('should rollback transaction on error during claim', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 1, receiverId: null, status: 'available', price: 50.00 };
            const receiverInstance = { id: 2, credits: 100.00 };

            mock.method(Donation, 'findByPk', async (id, opts) => {
                if (opts && opts.transaction) {
                    return { ...donationInstance, status: 'collected' };
                }
                return donationInstance;
            });

            mock.method(User, 'findByPk', async (id, opts) => {
                if (id == 2) return receiverInstance;
                return null;
            });

            const transactionMock = {
                commit: mock.fn(async () => {}),
                rollback: mock.fn(async () => {})
            };
            mock.method(sequelize, 'transaction', async () => transactionMock);

            await donationController.claimDonation(req, res, next);

            assert.strictEqual(transactionMock.rollback.mock.callCount(), 1);
            assert.strictEqual(transactionMock.commit.mock.callCount(), 0);
            assert.strictEqual(res.redirectedTo, '/doacoes');
        });
    });

    // =========================================================
    // historyPage
    // =========================================================
    describe('historyPage', () => {
        test('should render history page with offered and received items', async () => {
            const req = mockRequest({}, { id: 2, admin: false });
            const res = mockResponse();
            const next = () => {};

            const userInstance = { id: 2, credits: 100.00 };
            mock.method(User, 'findByPk', async () => userInstance);

            const offeredItems = [{ id: 1, name: 'Item A', userId: 2 }];
            const receivedItems = [{ id: 2, name: 'Item B', receiverId: 2 }];

            let findAllCallCount = 0;
            mock.method(Donation, 'findAll', async () => {
                findAllCallCount++;
                if (findAllCallCount === 1) return offeredItems;
                return receivedItems;
            });

            await donationController.historyPage(req, res, next);

            assert.strictEqual(res.renderedTemplate, 'historico');
            assert.strictEqual(res.renderData.user, userInstance);
            assert.deepStrictEqual(res.renderData.offeredItems, offeredItems);
            assert.deepStrictEqual(res.renderData.receivedItems, receivedItems);
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({}, { id: 2, admin: false });
            const res = mockResponse();

            const dbError = new Error('DB crash');
            mock.method(User, 'findByPk', async () => { throw dbError; });

            let nextError = null;
            const next = (err) => { nextError = err; };

            await donationController.historyPage(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });

    // =========================================================
    // simulateDraw
    // =========================================================
    describe('simulateDraw', () => {
        test('should fail if user is not admin', async () => {
            const req = mockRequest({}, { id: 2, admin: false });
            const res = mockResponse();
            const next = () => { };

            await donationController.simulateDraw(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Acesso negado. Apenas administradores podem realizar sorteios.');
        });

        test('should successfully award credits to a random non-admin user', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => { };

            const luckyUser = { id: 3, name: 'Lucky User', email: 'lucky@mail.com', credits: 10.00, save: mock.fn(async () => { }) };

            let findOneWhere = null;
            mock.method(User, 'findOne', async (opts) => {
                findOneWhere = opts.where;
                return luckyUser;
            });

            let drawCreated = null;
            mock.method(Draw, 'create', async (opts) => {
                drawCreated = opts;
                return { id: 1, ...opts };
            });

            await donationController.simulateDraw(req, res, next);

            assert.strictEqual(findOneWhere.admin, false);
            assert.ok(luckyUser.credits === 60.00 || luckyUser.credits === 110.00);
            assert.strictEqual(luckyUser.save.mock.callCount(), 1);
            assert.ok(drawCreated !== null);
            assert.strictEqual(drawCreated.winnerId, 3);
            assert.strictEqual(drawCreated.adminId, 1);
            assert.strictEqual(res.redirectedTo, '/admin/sorteios');
            assert.match(req.flash('success_msg'), /Sorteio realizado! O usuário "Lucky User" \(lucky@mail.com\) recebeu R\$/);
        });

        test('should show error if no users are available for draw', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => {};

            mock.method(User, 'findOne', async () => null);

            await donationController.simulateDraw(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/sorteios');
            assert.strictEqual(req.flash('error_msg'), 'Nenhum usuário cadastrado para realizar o sorteio');
        });
    });

    // =========================================================
    // adminDrawsPage
    // =========================================================
    describe('adminDrawsPage', () => {
        test('should fail if user is not admin', async () => {
            const req = mockRequest({}, { id: 2, admin: false });
            const res = mockResponse();
            const next = () => {};

            await donationController.adminDrawsPage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Acesso negado. Apenas administradores podem acessar a página de sorteios.');
        });

        test('should fetch draws with pagination and render the adminSorteios template', async () => {
            const req = mockRequest({}, { id: 1, admin: true }, { page: '2' });
            const res = mockResponse();
            const next = () => {};

            const mockUser = { id: 1, name: 'Admin', admin: true };
            mock.method(User, 'findByPk', async () => mockUser);

            const mockDraws = [
                { id: 1, amount: 50.00, winnerId: 2, adminId: 1, createdAt: new Date() }
            ];

            let findAndCountAllOpts = null;
            mock.method(Draw, 'findAndCountAll', async (opts) => {
                findAndCountAllOpts = opts;
                return { count: 15, rows: mockDraws };
            });

            await donationController.adminDrawsPage(req, res, next);

            assert.strictEqual(findAndCountAllOpts.limit, 10);
            assert.strictEqual(findAndCountAllOpts.offset, 10);
            assert.strictEqual(res.renderedTemplate, 'adminSorteios');
            assert.strictEqual(res.renderData.user, mockUser);
            assert.strictEqual(res.renderData.draws, mockDraws);
            assert.strictEqual(res.renderData.currentPage, 2);
            assert.strictEqual(res.renderData.totalPages, 2);
            assert.strictEqual(res.renderData.totalCount, 15);
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const dbError = new Error('Database down');
            let nextError = null;
            const next = (err) => { nextError = err; };

            mock.method(User, 'findByPk', async () => { throw dbError; });

            await donationController.adminDrawsPage(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });

    // =========================================================
    // Admin Warehouse Endpoints
    // =========================================================
    describe('Admin Warehouse Endpoints', () => {
        test('adminWarehousePage should fail if user is not admin', async () => {
            const req = mockRequest({}, { id: 2, admin: false });
            const res = mockResponse();
            const next = () => { };

            await donationController.adminWarehousePage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Acesso negado. Apenas administradores podem gerenciar o armazém.');
        });

        test('adminWarehousePage should succeed if user is admin', async () => {
            const req = mockRequest({}, { id: 1, admin: true });
            const res = mockResponse();
            const next = () => { };

            const userInstance = { id: 1, admin: true };
            mock.method(User, 'findByPk', async () => userInstance);
            mock.method(Donation, 'findAll', async () => []);

            await donationController.adminWarehousePage(req, res, next);

            assert.strictEqual(res.renderedTemplate, 'adminArmazenagem');
            assert.ok(res.renderData.pendingEntries);
            assert.ok(res.renderData.pendingExits);
        });

        // --- confirmEntry (now sets triaged + condition) ---
        test('confirmEntry should fail if user is not admin', async () => {
            const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Acesso negado');
        });

        test('confirmEntry should fail if storageCode is missing', async () => {
            const req = mockRequest({ storageCode: '', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'Identificador de estocagem inválido. Deve seguir o formato Letra+Número-Letra+Número (ex: A1-S2, F12-B09)');
        });

        test('confirmEntry should fail if storageCode format is invalid', async () => {
            const invalidCodes = ['A-1', 'A1', 'a1-s2', 'A1-S', 'A1-S2-L3', '1A-S2'];
            for (const code of invalidCodes) {
                const req = mockRequest({ storageCode: code, condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
                const res = mockResponse();
                const next = () => { };

                await donationController.confirmEntry(req, res, next);

                assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
                assert.strictEqual(req.flash('error_msg'), 'Identificador de estocagem inválido. Deve seguir o formato Letra+Número-Letra+Número (ex: A1-S2, F12-B09)');
            }
        });

        test('confirmEntry should fail if condition is missing', async () => {
            const req = mockRequest({ storageCode: 'A1-S2', condition: '' }, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'A condição do item é obrigatória');
        });

        test('confirmEntry should fail if condition is invalid', async () => {
            const req = mockRequest({ storageCode: 'A1-S2', condition: 'Excelente' }, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'A condição do item é obrigatória');
        });

        test('confirmEntry should fail if donation is not found', async () => {
            const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 999 });
            const res = mockResponse();
            const next = () => {};

            mock.method(Donation, 'findByPk', async () => null);

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
        });

        test('confirmEntry should fail if donation status is not "registered"', async () => {
            const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, status: 'available', save: mock.fn(async () => {}) };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'Esta doação já foi processada');
        });

        test('confirmEntry should succeed and set status to "triaged" with condition and storageCode', async () => {
            const req = mockRequest({ storageCode: 'A1-S2', condition: 'Bom' }, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            const donationInstance = { id: 10, name: 'Monitor Dell', status: 'registered', storageCode: null, condition: null, save: mock.fn(async () => { }) };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmEntry(req, res, next);

            assert.strictEqual(donationInstance.status, 'triaged');
            assert.strictEqual(donationInstance.condition, 'Bom');
            assert.strictEqual(donationInstance.storageCode, 'A1-S2');
            assert.strictEqual(donationInstance.save.mock.callCount(), 1);
            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.match(req.flash('success_msg'), /Triagem concluída/);
        });

        // --- confirmExit ---
        test('confirmExit should fail if user is not admin', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            await donationController.confirmExit(req, res, next);

            assert.strictEqual(res.redirectedTo, '/doacoes');
            assert.strictEqual(req.flash('error_msg'), 'Acesso negado');
        });

        test('confirmExit should fail if donation is not found', async () => {
            const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 999 });
            const res = mockResponse();
            const next = () => {};

            mock.method(Donation, 'findByPk', async () => null);

            await donationController.confirmExit(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
        });

        test('confirmExit should fail if donation status is not "pending"', async () => {
            const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, status: 'available', save: mock.fn(async () => {}) };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmExit(req, res, next);

            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('error_msg'), 'Este item não possui retirada pendente');
        });

        test('confirmExit should succeed and update status to collected', async () => {
            const req = mockRequest({}, { id: 1, admin: true }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => { };

            const donationInstance = { id: 10, status: 'pending', save: mock.fn(async () => { }) };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmExit(req, res, next);

            assert.strictEqual(donationInstance.status, 'collected');
            assert.strictEqual(donationInstance.save.mock.callCount(), 1);
            assert.strictEqual(res.redirectedTo, '/admin/armazenagem');
            assert.strictEqual(req.flash('success_msg'), 'Entrega física confirmada com sucesso!');
        });
    });

    // =========================================================
    // confirmTriage (donor confirms after admin assessment)
    // =========================================================
    describe('confirmTriage', () => {
        test('should fail if donation does not exist', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 999 });
            const res = mockResponse();
            const next = () => {};

            mock.method(Donation, 'findByPk', async () => null);

            await donationController.confirmTriage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
        });

        test('should fail if user is not the donor', async () => {
            const req = mockRequest({}, { id: 3, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 2, status: 'triaged' };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmTriage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('error_msg'), 'Você não tem permissão para confirmar esta doação');
        });

        test('should fail if status is not "triaged"', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 2, status: 'registered' };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmTriage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('error_msg'), 'Esta doação não está aguardando confirmação de triagem');
        });

        test('should succeed and set status to "available"', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 2, status: 'triaged', save: mock.fn(async () => {}) };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.confirmTriage(req, res, next);

            assert.strictEqual(donationInstance.status, 'available');
            assert.strictEqual(donationInstance.save.mock.callCount(), 1);
            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('success_msg'), 'Doação confirmada e disponível na listagem!');
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();

            const dbError = new Error('DB crash');
            mock.method(Donation, 'findByPk', async () => { throw dbError; });

            let nextError = null;
            const next = (err) => { nextError = err; };

            await donationController.confirmTriage(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });

    // =========================================================
    // cancelTriage (donor cancels after admin assessment)
    // =========================================================
    describe('cancelTriage', () => {
        test('should fail if donation does not exist', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 999 });
            const res = mockResponse();
            const next = () => {};

            mock.method(Donation, 'findByPk', async () => null);

            await donationController.cancelTriage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('error_msg'), 'Doação não encontrada');
        });

        test('should fail if user is not the donor', async () => {
            const req = mockRequest({}, { id: 3, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 2, status: 'triaged' };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.cancelTriage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('error_msg'), 'Você não tem permissão para cancelar esta doação');
        });

        test('should fail if status is not "triaged"', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 2, status: 'available' };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.cancelTriage(req, res, next);

            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('error_msg'), 'Esta doação não está aguardando confirmação de triagem');
        });

        test('should succeed and set status to "cancelled"', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();
            const next = () => {};

            const donationInstance = { id: 10, userId: 2, status: 'triaged', save: mock.fn(async () => {}) };
            mock.method(Donation, 'findByPk', async () => donationInstance);

            await donationController.cancelTriage(req, res, next);

            assert.strictEqual(donationInstance.status, 'cancelled');
            assert.strictEqual(donationInstance.save.mock.callCount(), 1);
            assert.strictEqual(res.redirectedTo, '/historico');
            assert.strictEqual(req.flash('success_msg'), 'Doação cancelada. O item poderá ser retirado no armazém.');
        });

        test('should forward database errors via next(err)', async () => {
            const req = mockRequest({}, { id: 2, admin: false }, {}, { id: 10 });
            const res = mockResponse();

            const dbError = new Error('DB crash');
            mock.method(Donation, 'findByPk', async () => { throw dbError; });

            let nextError = null;
            const next = (err) => { nextError = err; };

            await donationController.cancelTriage(req, res, next);

            assert.strictEqual(nextError, dbError);
        });
    });
});
