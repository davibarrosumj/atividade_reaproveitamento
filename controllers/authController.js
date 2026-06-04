require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.loginPage = (req, res) => res.render('login');

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

    const token = jwt.sign(
        { id: user.id, name: user.name, admin: user.admin },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.cookie('token', token, { httpOnly: true });
    req.flash('success', 'Login realizado com sucesso!');
    res.redirect('/dashboard');
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
