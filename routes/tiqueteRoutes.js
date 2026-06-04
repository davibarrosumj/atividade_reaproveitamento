const express = require('express');
const router = express.Router();

const tiqueteController = require('../controllers/tiqueteController');

const { authMiddleware, adminStatusMiddleware, authorize } = require('../middlewares/auth');

router.get('/', authMiddleware, adminStatusMiddleware, authorize(['simple']), tiqueteController.getTiquetes);
router.get('/devedores', authMiddleware, adminStatusMiddleware, authorize(['simple']), tiqueteController.getDevedores);
router.post('/pagar/:id', authMiddleware, adminStatusMiddleware, authorize(['simple']), tiqueteController.postPagarTiquete);

module.exports = router;
