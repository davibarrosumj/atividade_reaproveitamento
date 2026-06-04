const jwt = require('jsonwebtoken');

const clearSessionAuth = (req) => {
    req.session.user = null;
    req.session.authToken = null;
};

const buildSessionUser = (decodedUser) => ({
    id: decodedUser.id,
    name: decodedUser.name,
    email: decodedUser.email,
    userType: decodedUser.userType
});

const getAuthenticatedSessionUser = (req) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não está configurado nas variáveis de ambiente.');
    }

    let token = null;

    if (req.session && req.session.authToken) {
        token = req.session.authToken;
    }

    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return null;
    }

    try {
        return buildSessionUser(jwt.verify(token, process.env.JWT_SECRET));
    } catch (error) {
        clearSessionAuth(req);
        return null;
    }
};

const authMiddleware = (req, res, next) => {
    // Autenticacao obrigatoria: sem JWT valido, a rota nao continua.
    const authenticatedUser = getAuthenticatedSessionUser(req);

    if (!authenticatedUser) {
        req.flash('error', 'Sessao expirada. Faca login novamente.');
        return res.redirect('/');
    }

    req.session.user = authenticatedUser;
    req.user = authenticatedUser;

    next();
};

const adminStatusMiddleware = (req, res, next) => {
    // Status administrativo opcional: define privilegios sem bloquear rotas publicas.
    const authenticatedUser = getAuthenticatedSessionUser(req);

    req.session.user = authenticatedUser;
    req.isAdmin = Boolean(authenticatedUser && authenticatedUser.userType === 'simple');
    req.isPowerUser = Boolean(authenticatedUser && authenticatedUser.userType === 'super');
    req.canCreateAdmin = req.isPowerUser;

    next();
};

const authorize = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            req.flash('error', 'Sessão expirada. Faça login novamente.');
            return res.redirect('/');
        }
        if (!allowedTypes.includes(req.user.userType)) {
            req.flash('error', 'Acesso negado. Permissão insuficiente.');
            return res.redirect('/dashboard');
        }
        next();
    };
};

const cadastroAccessMiddleware = (req, res, next) => {
    const authenticatedUser = getAuthenticatedSessionUser(req);
    
    // Apenas o Super User ('super') logado pode acessar o cadastro
    if (!authenticatedUser || authenticatedUser.userType !== 'super') {
        req.flash('error', 'Acesso negado. Apenas o Super User pode criar novos usuários.');
        return res.redirect('/dashboard');
    }
    
    next();
};

module.exports = {
    authMiddleware,
    adminStatusMiddleware,
    authorize,
    cadastroAccessMiddleware,
    clearSessionAuth,
    getAuthenticatedSessionUser
};
