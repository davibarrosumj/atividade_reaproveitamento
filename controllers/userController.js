const bcrypt = require('bcryptjs');

const User = require('../models/userModel');


class SimpleUser {
    static async create(userData) {
        return User.create({
            ...userData,
            userType: 'simple'
        });
    }
}


class SuperUser {
    static async create(userData) {
        return User.create({
            ...userData,
            userType: 'super'
        });
    }
}


exports.getCadastro = async (req, res) => {
    res.render('cadastro', {
        canCreateAdmin: req.canCreateAdmin
    });
};


exports.postCadastro = async ( req, res ) => {
    const { name, email, password, isAdmin } = req.body;
    const canCreateAdmin = req.canCreateAdmin;

    if (isAdmin && !canCreateAdmin) {
        req.flash('error', 'Apenas o power user pode criar administradores.');
        return res.redirect('/cadastro');
    }

    const UserType = isAdmin && canCreateAdmin ? SuperUser : SimpleUser;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await UserType.create({
            name,
            email,
            password: hashedPassword
        });
    } catch (error) {
        req.flash('error', `Erro ao criar usuario: ${error.message}`);
        return res.redirect('/cadastro');
    }

    req.flash('success', 'Usuario criado com sucesso.');
    res.redirect('/');
};
