const { execFileSync } = require('child_process');
const ejs = require('ejs');
const assert = require('assert');
const jwt = require('jsonwebtoken');

const javascriptFiles = [
    'app.js',
    'database.js',
    'routes/authRoutes.js',
    'routes/dashboardRoutes.js',
    'routes/veiculoRoutes.js',
    'routes/tiqueteRoutes.js',
    'controllers/authController.js',
    'controllers/dashController.js',
    'controllers/userController.js',
    'controllers/veiculoController.js',
    'controllers/tiqueteController.js',
    'middlewares/auth.js',
    'models/estacionamentoModel.js',
    'models/userModel.js',
    'models/registroModel.js',
    'models/tiqueteModel.js'
];

const viewTests = [
    {
        file: 'views/login.ejs',
        data: {
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/cadastro.ejs',
        data: {
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/veiculosRegistro.ejs',
        data: {
            registrosAtivos: [
                {
                    id: 1,
                    placa: 'ABC1D23',
                    tipoVeiculo: 'carro',
                    horarioEntrada: new Date(),
                    Tiquete: {
                        id: 1,
                        codigo: 'TK-123456',
                        status: 'pago'
                    }
                }
            ],
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/dashboardUser.ejs',
        data: {
            user: {
                name: 'Usuario',
                email: 'usuario@mail.com'
            },
            estacionamento: {
                carros: {
                    capacidadeTotal: 100,
                    vagasOcupadas: 10,
                    vagasDisponiveis: 90,
                    porcentagemOcupacao: 10
                },
                motos: {
                    capacidadeTotal: 50,
                    vagasOcupadas: 5,
                    vagasDisponiveis: 45,
                    porcentagemOcupacao: 10
                }
            },
            canCreateAdmin: true
        }
    },
    {
        file: 'views/dashboardManager.ejs',
        data: {
            user: {
                name: 'Admin',
                email: 'admin@mail.com'
            },
            estacionamento: {
                carros: {
                    capacidadeTotal: 100,
                    vagasOcupadas: 10,
                    vagasDisponiveis: 90,
                    porcentagemOcupacao: 10
                },
                motos: {
                    capacidadeTotal: 50,
                    vagasOcupadas: 5,
                    vagasDisponiveis: 45,
                    porcentagemOcupacao: 10
                }
            },
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/tiquetesList.ejs',
        data: {
            tiquetes: [
                {
                    id: 1,
                    codigo: 'TK-123456',
                    valor: 10.00,
                    status: 'pago',
                    Registro: {
                        placa: 'ABC1D23',
                        tipoVeiculo: 'carro',
                        horarioEntrada: new Date()
                    },
                    CriadoPor: {
                        name: 'Admin Criador'
                    },
                    ValidadoPor: {
                        name: 'Admin Validador'
                    }
                }
            ],
            search: '',
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/devedoresList.ejs',
        data: {
            devedores: [
                {
                    id: 1,
                    codigo: 'TK-654321',
                    valor: 10.00,
                    status: 'pendente',
                    Registro: {
                        placa: 'XYZ9K99',
                        tipoVeiculo: 'carro',
                        horarioEntrada: new Date(),
                        horarioSaida: new Date()
                    },
                    CriadoPor: {
                        name: 'Admin Criador'
                    }
                }
            ],
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/config.ejs',
        data: {
            estacionamento: {
                capacidadeCarros: 150,
                capacidadeMotos: 20,
                vagasOcupadasCarros: 5,
                vagasOcupadasMotos: 2,
                valorTiqueteCarro: 4.00,
                valorTiqueteMoto: 2.00
            },
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    }
];

javascriptFiles.forEach((file) => {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
});

// Testes unitários para o middleware auth.js
function runMiddlewareTests() {
    console.log('Iniciando testes unitários do middleware...');

    // Garantir chave secreta temporária para testes
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test_secret_key_123';

    const payload = { id: 99, name: 'Tester', email: 'tester@mail.com', userType: 'simple' };
    const validToken = jwt.sign(payload, process.env.JWT_SECRET);
    const invalidToken = 'invalid.token.string';

    const { getAuthenticatedSessionUser, authMiddleware, adminStatusMiddleware, authorize, cadastroAccessMiddleware } = require('../middlewares/auth');

    // Teste 1: getAuthenticatedSessionUser com token de sessão válido
    {
        const req = {
            session: { authToken: validToken },
            headers: {}
        };
        const user = getAuthenticatedSessionUser(req);
        assert.ok(user, 'Deve retornar o usuário decodificado.');
        assert.strictEqual(user.email, payload.email);
        assert.strictEqual(user.userType, payload.userType);
    }

    // Teste 2: getAuthenticatedSessionUser com header Authorization
    {
        const req = {
            session: {},
            headers: { authorization: `Bearer ${validToken}` }
        };
        const user = getAuthenticatedSessionUser(req);
        assert.ok(user, 'Deve autenticar com token de Authorization header.');
        assert.strictEqual(user.email, payload.email);
    }

    // Teste 3: getAuthenticatedSessionUser com token inválido
    {
        const req = {
            session: { authToken: invalidToken },
            headers: {}
        };
        const user = getAuthenticatedSessionUser(req);
        assert.strictEqual(user, null, 'Deve retornar null para token inválido.');
    }

    // Teste 4: authMiddleware com token válido chama next()
    {
        const req = {
            session: { authToken: validToken },
            headers: {}
        };
        let nextCalled = false;
        const res = {};
        const next = () => { nextCalled = true; };

        authMiddleware(req, res, next);
        assert.ok(nextCalled, 'Deve chamar next() com token válido.');
        assert.strictEqual(req.user.email, payload.email);
    }

    // Teste 5: authMiddleware sem token redireciona
    {
        const req = {
            session: {},
            headers: {},
            flash: (key, msg) => {
                assert.strictEqual(key, 'error');
            }
        };
        let redirected = false;
        const res = {
            redirect: (path) => {
                redirected = true;
                assert.strictEqual(path, '/');
            }
        };
        const next = () => { throw new Error('Não deveria chamar next()'); };

        authMiddleware(req, res, next);
        assert.ok(redirected, 'Deve redirecionar para login.');
    }

    // Teste 6: authorize permite tipos autorizados
    {
        const req = { user: { userType: 'simple' } };
        let nextCalled = false;
        const res = {};
        const next = () => { nextCalled = true; };

        authorize(['simple'])(req, res, next);
        assert.ok(nextCalled, 'Deve permitir acesso do simple.');
    }

    // Teste 7: authorize rejeita tipos não autorizados
    {
        const req = {
            user: { userType: 'super' },
            flash: (key, msg) => {
                assert.strictEqual(key, 'error');
            }
        };
        let redirected = false;
        const res = {
            redirect: (path) => {
                redirected = true;
                assert.strictEqual(path, '/dashboard');
            }
        };
        const next = () => { throw new Error('Não deveria chamar next()'); };

        authorize(['simple'])(req, res, next);
        assert.ok(redirected, 'Deve redirecionar para /dashboard.');
    }

    // Teste 8: cadastroAccessMiddleware bloqueia logado não-super
    {
        const req = {
            session: { authToken: validToken }, // userType é 'simple'
            headers: {},
            flash: (key, msg) => {
                assert.strictEqual(key, 'error');
            }
        };
        let redirected = false;
        const res = {
            redirect: (path) => {
                redirected = true;
                assert.strictEqual(path, '/dashboard');
            }
        };
        const next = () => { throw new Error('Não deveria chamar next()'); };

        cadastroAccessMiddleware(req, res, next);
        assert.ok(redirected, 'Deve bloquear usuário comum logado.');
    }

    // Teste 9: cadastroAccessMiddleware permite super user logado
    {
        const superToken = jwt.sign({ ...payload, userType: 'super' }, process.env.JWT_SECRET);
        const req = {
            session: { authToken: superToken },
            headers: {}
        };
        let nextCalled = false;
        const res = {};
        const next = () => { nextCalled = true; };

        cadastroAccessMiddleware(req, res, next);
        assert.ok(nextCalled, 'Deve permitir Super User.');
    }

    // Teste 10: cadastroAccessMiddleware bloqueia visitante (não logado)
    {
        const req = {
            session: {},
            headers: {},
            flash: (key, msg) => {
                assert.strictEqual(key, 'error');
            }
        };
        let redirected = false;
        const res = {
            redirect: (path) => {
                redirected = true;
                assert.strictEqual(path, '/dashboard');
            }
        };
        const next = () => { throw new Error('Não deveria chamar next()'); };

        cadastroAccessMiddleware(req, res, next);
        assert.ok(redirected, 'Deve bloquear visitante.');
    }

    // Restaurar env original
    process.env.JWT_SECRET = originalSecret;
    console.log('Testes unitários do middleware concluídos com sucesso!');
}

runMiddlewareTests();

viewTests.forEach(({ file, data }) => {
    ejs.renderFile(file, data, (error) => {
        if (error) {
            throw error;
        }
    });
});

console.log('Testes concluidos com sucesso.');
