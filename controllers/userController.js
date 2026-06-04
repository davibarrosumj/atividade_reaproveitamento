const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

exports.getCadastro = async (req, res) => {
    res.render('cadastro', {
        canCreateAdmin: req.canCreateAdmin
    });
};

exports.postCadastro = async (req, res) => {
    const { name, email, password } = req.body;

    if (!req.canCreateAdmin) {
        req.flash('error', 'Apenas o Super User pode criar novos usuários.');
        return res.redirect('/dashboard');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await User.create({
            name,
            email,
            password: hashedPassword,
            userType: 'simple'
        });
    } catch (error) {
        req.flash('error', `Erro ao criar usuario: ${error.message}`);
        return res.redirect('/cadastro');
    }

    req.flash('success', 'Usuário operador criado com sucesso.');
    res.redirect('/dashboard');
};
