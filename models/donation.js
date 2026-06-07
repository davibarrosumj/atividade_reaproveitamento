const DataTypes = require('sequelize');
const sequelize = require('../database');
const User = require('./user');

const Donation = sequelize.define('Donation', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    photo: {
        type: DataTypes.TEXT, // Base64 representation of the image
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'registered'
    },
    storageCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    condition: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// Setup relationships
Donation.belongsTo(User, { as: 'donor', foreignKey: 'userId' });
Donation.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
User.hasMany(Donation, { as: 'donatedItems', foreignKey: 'userId' });
User.hasMany(Donation, { as: 'receivedItems', foreignKey: 'receiverId' });

module.exports = Donation;
