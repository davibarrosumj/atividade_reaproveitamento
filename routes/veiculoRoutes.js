const express = require('express');
const router = express.Router();

const veiculoController = require('../controllers/veiculoController');

const { authMiddleware, adminStatusMiddleware, authorize } = require('../middlewares/auth');

router.get('/registro', authMiddleware, adminStatusMiddleware, authorize(['super']), veiculoController.getVeiculosRegistro);
router.post('/registro/entrada', authMiddleware, adminStatusMiddleware, authorize(['super']), veiculoController.postEntrada);
router.post('/registro/saida/:id', authMiddleware, adminStatusMiddleware, authorize(['super']), veiculoController.postSaida);

module.exports = router;
