const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPharmacies,
  getNearbyPharmacies,
  getMyPharmacy,
  updateMyPharmacy,
  getPharmacy,
  updatePharmacyStatus,
} = require('../controllers/pharmacyController');

router.get('/', getPharmacies);
router.get('/nearby', getNearbyPharmacies);
router
  .route('/me')
  .get(protect, authorize('pharmacy'), getMyPharmacy)
  .put(protect, authorize('pharmacy'), updateMyPharmacy);
router.get('/:id', getPharmacy);
router.put('/:id/status', protect, authorize('admin'), updatePharmacyStatus);

module.exports = router;
