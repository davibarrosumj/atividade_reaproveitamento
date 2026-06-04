const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const { adminStatusMiddleware, cadastroAccessMiddleware } = require('../middlewares/auth');

router.get('/', authController.getLoginPage);
router.get('/cadastro', adminStatusMiddleware, cadastroAccessMiddleware, userController.getCadastro);

router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);
router.post('/cadastro', adminStatusMiddleware, cadastroAccessMiddleware, userController.postCadastro);

router.initializeSystem = authController.initializeSystem;

module.exports = router;
