const Estacionamento = require('../models/estacionamentoModel');


const getDadosEstacionamento = async () => {
    const [estacionamento] = await Estacionamento.findOrCreate({
        where: { id: 1 },
        defaults: { 
            vagasOcupadasCarros: 0,
            vagasOcupadasMotos: 0,
            capacidadeCarros: Number(process.env.ESTACIONAMENTO_CAPACIDADE_CARROS || 150),
            capacidadeMotos: Number(process.env.ESTACIONAMENTO_CAPACIDADE_MOTOS || 20),
            valorTiqueteCarro: Number(process.env.TIQUETE_VALOR_CARRO || 4.00),
            valorTiqueteMoto: Number(process.env.TIQUETE_VALOR_MOTO || 2.00)
        }
    });

    const capCarros = estacionamento.capacidadeCarros;
    const ocupCarros = estacionamento.vagasOcupadasCarros;
    const dispCarros = Math.max(0, capCarros - ocupCarros);
    const pctCarros = capCarros > 0 ? Math.round((ocupCarros / capCarros) * 100) : 0;

    const capMotos = estacionamento.capacidadeMotos;
    const ocupMotos = estacionamento.vagasOcupadasMotos;
    const dispMotos = Math.max(0, capMotos - ocupMotos);
    const pctMotos = capMotos > 0 ? Math.round((ocupMotos / capMotos) * 100) : 0;

    return {
        carros: {
            capacidadeTotal: capCarros,
            vagasOcupadas: ocupCarros,
            vagasDisponiveis: dispCarros,
            porcentagemOcupacao: pctCarros
        },
        motos: {
            capacidadeTotal: capMotos,
            vagasOcupadas: ocupMotos,
            vagasDisponiveis: dispMotos,
            porcentagemOcupacao: pctMotos
        }
    };
};


exports.getDashboard = async (req, res) => {
    const estacionamento = await getDadosEstacionamento();
    const dashboardView = req.isAdmin ? 'dashboardManager' : 'dashboardUser';

    res.render(dashboardView, {
        user: req.session.user,
        estacionamento,
        canCreateAdmin: req.canCreateAdmin
    });
};

exports.getConfigPage = async (req, res) => {
    try {
        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: {
                vagasOcupadasCarros: 0,
                vagasOcupadasMotos: 0,
                capacidadeCarros: Number(process.env.ESTACIONAMENTO_CAPACIDADE_CARROS || 150),
                capacidadeMotos: Number(process.env.ESTACIONAMENTO_CAPACIDADE_MOTOS || 20),
                valorTiqueteCarro: Number(process.env.TIQUETE_VALOR_CARRO || 4.00),
                valorTiqueteMoto: Number(process.env.TIQUETE_VALOR_MOTO || 2.00)
            }
        });

        res.render('config', {
            user: req.session.user,
            estacionamento,
            canCreateAdmin: req.canCreateAdmin
        });
    } catch (error) {
        req.flash('error', `Erro ao carregar configurações: ${error.message}`);
        res.redirect('/dashboard');
    }
};

exports.postConfig = async (req, res) => {
    const { capacidadeCarros, capacidadeMotos, valorTiqueteCarro, valorTiqueteMoto } = req.body;

    const capCarros = Number(capacidadeCarros);
    const capMotos = Number(capacidadeMotos);
    const valCarro = Number(valorTiqueteCarro);
    const valMoto = Number(valorTiqueteMoto);

    try {
        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: {
                vagasOcupadasCarros: 0,
                vagasOcupadasMotos: 0
            }
        });

        // Validação
        if (!Number.isInteger(capCarros) || capCarros < 1 ||
            !Number.isInteger(capMotos) || capMotos < 1) {
            req.flash('error', 'As capacidades devem ser números inteiros maiores que zero.');
            return res.redirect('/dashboard/config');
        }

        if (isNaN(valCarro) || valCarro <= 0 ||
            isNaN(valMoto) || valMoto <= 0) {
            req.flash('error', 'Os valores dos tíquetes devem ser números positivos maiores que zero.');
            return res.redirect('/dashboard/config');
        }

        if (capCarros < estacionamento.vagasOcupadasCarros) {
            req.flash('error', `A capacidade de carros não pode ser menor que o número de vagas ocupadas (${estacionamento.vagasOcupadasCarros}).`);
            return res.redirect('/dashboard/config');
        }

        if (capMotos < estacionamento.vagasOcupadasMotos) {
            req.flash('error', `A capacidade de motos não pode ser menor que o número de vagas ocupadas (${estacionamento.vagasOcupadasMotos}).`);
            return res.redirect('/dashboard/config');
        }

        await estacionamento.update({
            capacidadeCarros: capCarros,
            capacidadeMotos: capMotos,
            valorTiqueteCarro: valCarro,
            valorTiqueteMoto: valMoto
        });

        req.flash('success', 'Configurações de vagas e tarifas atualizadas com sucesso.');
        res.redirect('/dashboard');
    } catch (error) {
        req.flash('error', `Erro ao salvar configurações: ${error.message}`);
        res.redirect('/dashboard/config');
    }
};
