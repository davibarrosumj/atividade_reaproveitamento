require('dotenv').config();

const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.loginPage = (req, res) => res.render('login');

exports.dashboard = (req, res) => res.render(
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
    
    if (!user) return res.status(400).json({
        message: 'Usuário não encontrado'
    });

    const validPassword = await bcrypt.compare(
        password,
        user.password
    );

    if (!validPassword) return res.status(400).json({ message: 'Senha inválida' });

    req.session.user = { email: user.email };

    //res.json({ message: 'Login realizado' });
    res.render( 'dashboard',
    { user: req.session.user });
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
