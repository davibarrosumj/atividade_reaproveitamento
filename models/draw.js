const DataTypes = require('sequelize');
const sequelize = require('../database');
const User = require('./user');

const Draw = sequelize.define('Draw', {
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    winnerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    }
});

// Setup relationships
Draw.belongsTo(User, { as: 'winner', foreignKey: 'winnerId' });
Draw.belongsTo(User, { as: 'admin', foreignKey: 'adminId' });
User.hasMany(Draw, { as: 'wonDraws', foreignKey: 'winnerId' });
User.hasMany(Draw, { as: 'conductedDraws', foreignKey: 'adminId' });

module.exports = Draw;
