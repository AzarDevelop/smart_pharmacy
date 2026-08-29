const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReservation,
  getMyReservations,
  getPharmacyReservations,
  updateReservationStatus,
  cancelReservation,
  getAllReservations,
} = require('../controllers/reservationController');

router.post('/', protect, authorize('user'), createReservation);
router.get('/my', protect, authorize('user'), getMyReservations);
router.get('/pharmacy', protect, authorize('pharmacy'), getPharmacyReservations);
router.get('/', protect, authorize('admin'), getAllReservations);
router.put('/:id/status', protect, authorize('pharmacy'), updateReservationStatus);
router.put('/:id/cancel', protect, authorize('user'), cancelReservation);

module.exports = router;
