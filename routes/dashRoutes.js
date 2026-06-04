const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const dashController = require('../controllers/dashController');


router.get('/dashboard', authMiddleware, dashController.dashboardPage);

module.exports = router;
