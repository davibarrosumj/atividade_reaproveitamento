const { Op } = require('sequelize');
const sequelize = require('../database');
const User = require('../models/user');
const Donation = require('../models/donation');
const Draw = require('../models/draw');

exports.listDonations = async (req, res, next) => {
    try {
        const { category, name } = req.query;
        const where = { status: 'available' };

        if (category) {
            where.category = category;
        }

        if (name) {
            where.name = { [Op.iLike]: `%${name}%` };
        }

        const donations = await Donation.findAll({
            where,
            include: [{ model: User, as: 'donor', attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        const user = await User.findByPk(req.user.id);

        res.render('doacoes', {
            user,
            donations,
            filters: { category: category || '', name: name || '' }
        });
    } catch (err) {
        next(err);
    }
};

exports.registerDonationPage = async (req, res, next) => {
    if (req.user.admin) {
        req.flash('error_msg', 'Administradores não podem realizar doações.');
        return res.redirect('/doacoes');
    }

    try {
        const user = await User.findByPk(req.user.id);
        res.render('novaDoacao', { user });
    } catch (err) {
        next(err);
    }
};

exports.createDonation = async (req, res, next) => {
    if (req.user.admin) {
        req.flash('error_msg', 'Administradores não podem realizar doações.');
        return res.redirect('/doacoes');
    }

    const { name, description, category, price, photo } = req.body;

    if (!name || !description || !category || !price || !photo) {
        req.flash('error_msg', 'Todos os campos são obrigatórios');
        return res.redirect('/doacoes/nova');
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 1.00 || numericPrice > 500.00) {
        req.flash('error_msg', 'O valor deve ser entre R$ 1,00 e R$ 500,00');
        return res.redirect('/doacoes/nova');
    }

    // Verify Base64 photo size: approximate bytes = (length * 3) / 4
    const approxBytes = (photo.length * 3) / 4;
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (approxBytes > maxBytes) {
        req.flash('error_msg', 'A foto deve ter no máximo 2MB');
        return res.redirect('/doacoes/nova');
    }

    try {
        await Donation.create({
            name,
            description,
            category,
            price: numericPrice,
            photo,
            userId: req.user.id,
            status: 'registered'
        });

        req.flash('success_msg', 'Doação cadastrada com sucesso! Ela ficará visível na listagem pública após a entrega física e confirmação no armazém.');
        return res.redirect('/historico');
    } catch (err) {
        next(err);
    }
};

exports.claimDonation = async (req, res, next) => {
    if (req.user.admin) {
        req.flash('error_msg', 'Administradores não podem receber doações.');
        return res.redirect('/doacoes');
    }

    const donationId = req.params.id;
    const userId = req.user.id;

    try {
        const donation = await Donation.findByPk(donationId);

        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/doacoes');
        }

        if (donation.status !== 'available') {
            req.flash('error_msg', 'Este item não está disponível para resgate');
            return res.redirect('/doacoes');
        }

        if (donation.userId === userId) {
            req.flash('error_msg', 'Você não pode receber seu próprio item');
            return res.redirect('/doacoes');
        }

        const receiver = await User.findByPk(userId);
        if (parseFloat(receiver.credits) < parseFloat(donation.price)) {
            req.flash('error_msg', 'Saldo de créditos insuficiente');
            return res.redirect('/doacoes');
        }

        // Atomically perform transfer inside a database transaction
        const t = await sequelize.transaction();
        try {
            const freshReceiver = await User.findByPk(userId, { transaction: t });
            const freshDonor = await User.findByPk(donation.userId, { transaction: t });
            const freshDonation = await Donation.findByPk(donationId, { transaction: t });

            if (freshDonation.status !== 'available') {
                throw new Error('Este item não está disponível para resgate');
            }

            if (parseFloat(freshReceiver.credits) < parseFloat(freshDonation.price)) {
                throw new Error('Saldo de créditos insuficiente');
            }

            // Deduct from receiver
            freshReceiver.credits = parseFloat(freshReceiver.credits) - parseFloat(freshDonation.price);
            await freshReceiver.save({ transaction: t });

            // Add to donor
            freshDonor.credits = parseFloat(freshDonor.credits) + parseFloat(freshDonation.price);
            await freshDonor.save({ transaction: t });

            // Update donation
            freshDonation.receiverId = userId;
            freshDonation.status = 'pending';
            await freshDonation.save({ transaction: t });

            await t.commit();

            req.flash('success_msg', 'Doação reservada com sucesso! Visualize o ticket no seu histórico para retirar o item no armazém.');
            return res.redirect('/doacoes');
        } catch (transactionErr) {
            await t.rollback();
            req.flash('error_msg', transactionErr.message || 'Erro ao processar resgate');
            return res.redirect('/doacoes');
        }
    } catch (err) {
        next(err);
    }
};

exports.historyPage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        const offeredItems = await Donation.findAll({
            where: { userId },
            include: [{ model: User, as: 'receiver', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        const receivedItems = await Donation.findAll({
            where: { receiverId: userId },
            include: [{ model: User, as: 'donor', attributes: ['name', 'email'] }],
            order: [['updatedAt', 'DESC']]
        });

        res.render('historico', {
            user,
            offeredItems,
            receivedItems
        });
    } catch (err) {
        next(err);
    }
};

exports.simulateDraw = async (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error_msg', 'Acesso negado. Apenas administradores podem realizar sorteios.');
        return res.redirect('/doacoes');
    }

    try {
        // Pick a random user
        const randomUser = await User.findOne({
            where: { admin: false },
            order: sequelize.random()
        });

        if (!randomUser) {
            req.flash('error_msg', 'Nenhum usuário cadastrado para realizar o sorteio');
            return res.redirect('/admin/sorteios');
        }

        const bonusOptions = [50.00, 100.00];
        const bonus = bonusOptions[Math.floor(Math.random() * bonusOptions.length)];

        randomUser.credits = parseFloat(randomUser.credits) + bonus;
        await randomUser.save();

        // Record draw in history
        await Draw.create({
            winnerId: randomUser.id,
            adminId: req.user.id,
            amount: bonus
        });

        req.flash('success_msg', `Sorteio realizado! O usuário "${randomUser.name}" (${randomUser.email}) recebeu R$ ${bonus.toFixed(2)} em créditos.`);
        return res.redirect('/admin/sorteios');
    } catch (err) {
        next(err);
    }
};

exports.adminDrawsPage = async (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error_msg', 'Acesso negado. Apenas administradores podem acessar a página de sorteios.');
        return res.redirect('/doacoes');
    }

    try {
        const user = await User.findByPk(req.user.id);
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Draw.findAndCountAll({
            limit,
            offset,
            include: [
                { model: User, as: 'winner', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'admin', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.render('adminSorteios', {
            user,
            draws: rows,
            currentPage: page,
            totalPages,
            totalCount: count
        });
    } catch (err) {
        next(err);
    }
};

exports.adminWarehousePage = async (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error_msg', 'Acesso negado. Apenas administradores podem gerenciar o armazém.');
        return res.redirect('/doacoes');
    }

    try {
        const user = await User.findByPk(req.user.id);

        const pendingEntries = await Donation.findAll({
            where: { status: 'registered' },
            include: [{ model: User, as: 'donor', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        const pendingExits = await Donation.findAll({
            where: { status: 'pending' },
            include: [{ model: User, as: 'receiver', attributes: ['name', 'email'] }],
            order: [['updatedAt', 'DESC']]
        });

        res.render('adminArmazenagem', {
            user,
            pendingEntries,
            pendingExits
        });
    } catch (err) {
        next(err);
    }
};

exports.confirmEntry = async (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error_msg', 'Acesso negado');
        return res.redirect('/doacoes');
    }

    const { storageCode, condition } = req.body;
    const storageCodeRegex = /^[A-Z]\d+-[A-Z]\d+$/;
    if (!storageCode || !storageCodeRegex.test(storageCode.trim())) {
        req.flash('error_msg', 'Identificador de estocagem inválido. Deve seguir o formato Letra+Número-Letra+Número (ex: A1-S2, F12-B09)');
        return res.redirect('/admin/armazenagem');
    }

    const validConditions = ['Perfeito', 'Bom', 'Regular', 'Ruim', 'Quebrado'];
    if (!condition || !validConditions.includes(condition)) {
        req.flash('error_msg', 'A condição do item é obrigatória');
        return res.redirect('/admin/armazenagem');
    }

    try {
        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/admin/armazenagem');
        }

        if (donation.status !== 'registered') {
            req.flash('error_msg', 'Esta doação já foi processada');
            return res.redirect('/admin/armazenagem');
        }

        donation.status = 'triaged';
        donation.storageCode = storageCode.trim();
        donation.condition = condition;
        await donation.save();

        req.flash('success_msg', `Triagem concluída! Item "${donation.name}" avaliado como "${condition}" e estocado em: "${donation.storageCode}". Aguardando confirmação do doador.`);
        return res.redirect('/admin/armazenagem');
    } catch (err) {
        next(err);
    }
};

exports.confirmExit = async (req, res, next) => {
    if (!req.user.admin) {
        req.flash('error_msg', 'Acesso negado');
        return res.redirect('/doacoes');
    }

    try {
        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/admin/armazenagem');
        }

        if (donation.status !== 'pending') {
            req.flash('error_msg', 'Este item não possui retirada pendente');
            return res.redirect('/admin/armazenagem');
        }

        donation.status = 'collected';
        await donation.save();

        req.flash('success_msg', 'Entrega física confirmada com sucesso!');
        return res.redirect('/admin/armazenagem');
    } catch (err) {
        next(err);
    }
};

exports.confirmTriage = async (req, res, next) => {
    try {
        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/historico');
        }

        if (donation.userId !== req.user.id) {
            req.flash('error_msg', 'Você não tem permissão para confirmar esta doação');
            return res.redirect('/historico');
        }

        if (donation.status !== 'triaged') {
            req.flash('error_msg', 'Esta doação não está aguardando confirmação de triagem');
            return res.redirect('/historico');
        }

        donation.status = 'available';
        await donation.save();

        req.flash('success_msg', 'Doação confirmada e disponível na listagem!');
        return res.redirect('/historico');
    } catch (err) {
        next(err);
    }
};

exports.cancelTriage = async (req, res, next) => {
    try {
        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/historico');
        }

        if (donation.userId !== req.user.id) {
            req.flash('error_msg', 'Você não tem permissão para cancelar esta doação');
            return res.redirect('/historico');
        }

        if (donation.status !== 'triaged') {
            req.flash('error_msg', 'Esta doação não está aguardando confirmação de triagem');
            return res.redirect('/historico');
        }

        donation.status = 'cancelled';
        await donation.save();

        req.flash('success_msg', 'Doação cancelada. O item poderá ser retirado no armazém.');
        return res.redirect('/historico');
    } catch (err) {
        next(err);
    }
};

