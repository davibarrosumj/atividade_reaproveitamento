const express = require('express');
const router = express.Router();

const veiculoController = require('../controllers/veiculoController');

const { authMiddleware, adminStatusMiddleware, authorize } = require('../middlewares/auth');

router.get('/registro', authMiddleware, adminStatusMiddleware, authorize(['simple']), veiculoController.getVeiculosRegistro);
router.post('/registro/entrada', authMiddleware, adminStatusMiddleware, authorize(['simple']), veiculoController.postEntrada);
router.post('/registro/saida/:id', authMiddleware, adminStatusMiddleware, authorize(['simple']), veiculoController.postSaida);
router.post('/registro/saida-indevida/:id', authMiddleware, adminStatusMiddleware, authorize(['simple']), veiculoController.postSaidaIndevida);

module.exports = router;
