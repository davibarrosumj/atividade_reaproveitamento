const Registro = require('../models/registroModel');
const Estacionamento = require('../models/estacionamentoModel');

const PLACA_REGEX = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i;

exports.getVeiculosRegistro = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Acesso restrito a administradores.');
        return res.redirect('/dashboard');
    }

    try {
        const registrosAtivos = await Registro.findAll({
            where: { status: 'ativo' },
            order: [['horarioEntrada', 'ASC']]
        });

        res.render('veiculosRegistro', {
            registrosAtivos,
            canCreateAdmin: req.canCreateAdmin
        });
    } catch (error) {
        req.flash('error', `Erro ao buscar veículos: ${error.message}`);
        res.redirect('/dashboard');
    }
};

exports.postEntrada = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem registrar entrada.');
        return res.redirect('/dashboard');
    }

    let { placa } = req.body;
    if (!placa) {
        req.flash('error', 'Placa do veículo é obrigatória.');
        return res.redirect('/veiculos/registro');
    }

    placa = placa.trim().toUpperCase();

    if (!PLACA_REGEX.test(placa)) {
        req.flash('error', 'Formato de placa inválido. Formatos aceitos: ABC-1234 ou ABC1D23.');
        return res.redirect('/veiculos/registro');
    }

    try {
        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: { vagasOcupadas: 0 }
        });

        if (estacionamento.vagasOcupadas >= estacionamento.capacidadeTotal) {
            req.flash('error', 'Estacionamento lotado. Não é possível registrar entrada.');
            return res.redirect('/veiculos/registro');
        }

        const placaAtiva = await Registro.findOne({
            where: { placa, status: 'ativo' }
        });

        if (placaAtiva) {
            req.flash('error', `O veículo com placa ${placa} já está estacionado.`);
            return res.redirect('/veiculos/registro');
        }

        await Registro.create({
            placa,
            status: 'ativo'
        });

        await estacionamento.update({
            vagasOcupadas: estacionamento.vagasOcupadas + 1
        });

        req.flash('success', `Entrada do veículo ${placa} registrada com sucesso.`);
    } catch (error) {
        req.flash('error', `Erro ao registrar entrada: ${error.message}`);
    }

    res.redirect('/veiculos/registro');
};

exports.postSaida = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem registrar saída.');
        return res.redirect('/dashboard');
    }

    const { id } = req.params;

    try {
        const registro = await Registro.findOne({
            where: { id, status: 'ativo' }
        });

        if (!registro) {
            req.flash('error', 'Registro ativo de veículo não encontrado.');
            return res.redirect('/veiculos/registro');
        }

        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: { vagasOcupadas: 0 }
        });

        await registro.update({
            horarioSaida: new Date(),
            status: 'concluido'
        });

        const novasVagasOcupadas = Math.max(0, estacionamento.vagasOcupadas - 1);
        await estacionamento.update({
            vagasOcupadas: novasVagasOcupadas
        });

        req.flash('success', `Saída do veículo ${registro.placa} registrada com sucesso.`);
    } catch (error) {
        req.flash('error', `Erro ao registrar saída: ${error.message}`);
    }

    res.redirect('/veiculos/registro');
};
