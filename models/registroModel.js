const DataTypes = require('sequelize');
const sequelize = require('../database');

module.exports = sequelize.define('Registro', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    placa: {
        type: DataTypes.STRING,
        allowNull: false
    },
    horarioEntrada: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    horarioSaida: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ativo'
    }
});
