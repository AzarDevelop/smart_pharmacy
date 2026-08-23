const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('pharmacy', 'admin'), pharmacyController.createPharmacy);
router.get('/mine', authenticate, authorize('pharmacy', 'admin'), pharmacyController.getMyPharmacies);

router.get('/:id/inventory', pharmacyController.getInventory);
router.post('/:id/inventory', authenticate, authorize('pharmacy', 'admin'), pharmacyController.upsertStock);
router.delete('/:id/inventory/:stockId', authenticate, authorize('pharmacy', 'admin'), pharmacyController.deleteStock);

router.get('/:id/low-stock', authenticate, authorize('pharmacy', 'admin'), pharmacyController.getLowStock);
router.post('/:id/sales', authenticate, authorize('pharmacy', 'admin'), pharmacyController.recordSale);
router.get('/:id/predict/:medicineId', authenticate, authorize('pharmacy', 'admin'), pharmacyController.predictDemand);

router.get('/:id/reservations', authenticate, authorize('pharmacy', 'admin'), pharmacyController.getPharmacyReservations);

module.exports = router;
