const DataTypes = require('sequelize');
const sequelize = require('../database');

module.exports = sequelize.define('Estacionamento', {
    capacidadeCarros: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: Number(process.env.ESTACIONAMENTO_CAPACIDADE_CARROS || 150)
    },
    vagasOcupadasCarros: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    capacidadeMotos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: Number(process.env.ESTACIONAMENTO_CAPACIDADE_MOTOS || 20)
    },
    vagasOcupadasMotos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    valorTiqueteCarro: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: Number(process.env.TIQUETE_VALOR_CARRO || 4.00)
    },
    valorTiqueteMoto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: Number(process.env.TIQUETE_VALOR_MOTO || 2.00)
    }
});
