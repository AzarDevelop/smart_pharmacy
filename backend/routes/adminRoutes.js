const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

// Users
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);

// Pharmacies
router.get('/pharmacies', adminController.listPharmacies);
router.patch('/pharmacies/:id/verify', adminController.verifyPharmacy);
router.patch('/pharmacies/:id/unverify', adminController.unverifyPharmacy);
router.delete('/pharmacies/:id', adminController.deletePharmacy);

// Medicines (Catalogue Management)
router.get('/medicines', adminController.listMedicines);
router.post('/medicines', adminController.createMedicine);
router.put('/medicines/:id', adminController.updateMedicine);
router.delete('/medicines/:id', adminController.deleteMedicine);

// Reports / Overview
router.get('/reports/overview', adminController.getOverview);

module.exports = router;
