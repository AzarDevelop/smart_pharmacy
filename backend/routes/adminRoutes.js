const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/pharmacies', adminController.listPharmacies);
router.patch('/pharmacies/:id/verify', adminController.verifyPharmacy);
router.get('/reports/overview', adminController.getOverview);

module.exports = router;
