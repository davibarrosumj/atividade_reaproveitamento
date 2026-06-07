const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const donationController = require('../controllers/donationController');

router.get('/doacoes', protect, donationController.listDonations);
router.get('/doacoes/nova', protect, donationController.registerDonationPage);
router.post('/doacoes/nova', protect, donationController.createDonation);
router.post('/doacoes/receber/:id', protect, donationController.claimDonation);
router.get('/historico', protect, donationController.historyPage);
router.post('/sorteio', protect, donationController.simulateDraw);
router.post('/doacoes/confirmar-triagem/:id', protect, donationController.confirmTriage);
router.post('/doacoes/cancelar-triagem/:id', protect, donationController.cancelTriage);

// Admin Warehouse / Storage Routes
router.get('/admin/armazenagem', protect, donationController.adminWarehousePage);
router.post('/admin/armazenagem/entrada/:id', protect, donationController.confirmEntry);
router.post('/admin/armazenagem/saida/:id', protect, donationController.confirmExit);

// Admin Draws History Routes
router.get('/admin/sorteios', protect, donationController.adminDrawsPage);

module.exports = router;
