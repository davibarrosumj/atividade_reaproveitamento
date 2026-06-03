require('dotenv').config();

const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.loginPage = (req, res) => res.render('login');

exports.dashboardPage = (req, res) => res.render(
    'dashboard',
    { user: req.session.User }
);

exports.createUser = async (req, res) => {
    const hash = await bcrypt.hash(process.env.PU_PASSWORD, 10);
    await User.create({
        email: 'davi@mail.com',
        password: hash
    });
    
    res.send('Usuário criado');
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
        where: { email }
    });
    
    if (!user) {
        req.flash('error_msg', 'Usuário inválido');
        res.redirect('/');
        return
    }

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if (!validPassword) {
        req.flash('error_msg', 'Senha inválida');
        res.redirect('/');
        return
    }

    req.session.user = { email: user.email };

    res.render(
        'dashboard',
        { user: req.session.user, success_msg: 'Login realizado com sucesso!' }
    );
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
