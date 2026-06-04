const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');


router.get('/', authController.loginPage);
router.get('/create-user', authController.createUser);
router.get('/logout', authController.logout);

router.post('/login', authController.login);

module.exports = router;
