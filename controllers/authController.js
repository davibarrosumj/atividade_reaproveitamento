require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sequelize = require('../database');
const User = require('../models/userModel');


exports.getLoginPage = (req, res) => res.render('login');


exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email }});
    
    if (!user) {
        req.flash('error', 'Usuario nao encontrado.');
        return res.redirect('/');
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        req.flash('error', 'Senha invalida.');
        return res.redirect('/');
    }

    const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType
    };

    req.session.user = sessionUser;
    req.session.authToken = jwt.sign(sessionUser, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.redirect('/dashboard');
};


exports.postLogout = (req, res) => {
    req.session.destroy();

    res.redirect('/');
};


exports.postRegister = async (req, res) => {
    res.redirect('/cadastro');
};


exports.ensurePowerUser = async () => {
    const password = await bcrypt.hash(process.env.POWER_USER_PASSWORD, 10);
    const powerUser = await User.findOne({ where: { email: 'admin@mail.com' } });

    if (powerUser) {
        await powerUser.update({
            name: 'admin',
            password,
            userType: 'power'
        });
        return;
    }

    await User.create({
        name: 'admin',
        email: 'admin@mail.com',
        password,
        userType: 'power'
    });
};


exports.initializeSystem = async () => {
    await sequelize.sync({ force: true });
    await exports.ensurePowerUser();
};
