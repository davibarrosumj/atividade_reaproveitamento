const express = require('express');
const router = express.Router();

const dashController = require('../controllers/dashController');

const { authMiddleware, adminStatusMiddleware, authorize } = require('../middlewares/auth');

router.get('/', authMiddleware, adminStatusMiddleware, authorize(['simple', 'super']), dashController.getDashboard);
router.get('/config', authMiddleware, adminStatusMiddleware, authorize(['super']), dashController.getConfigPage);
router.post('/config', authMiddleware, adminStatusMiddleware, authorize(['super']), dashController.postConfig);

module.exports = router;
