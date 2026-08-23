const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, reservationController.createReservation);
router.get('/mine', authenticate, reservationController.getMyReservations);
router.patch('/:id/status', authenticate, reservationController.updateStatus);

module.exports = router;
