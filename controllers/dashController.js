require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.dashboardPage = (req, res) => res.render('dashboard');
