const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authController.loginPage);
router.get('/create-user', authController.createUser);
router.get('/dashboard', authMiddleware, authController.dashboardPage);
router.get('/logout', authController.logout);

router.post('/login', authController.login);

module.exports = router;
