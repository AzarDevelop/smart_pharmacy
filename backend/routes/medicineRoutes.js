const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

router.get('/', medicineController.listMedicines);
router.get('/search', medicineController.searchMedicine);
router.get('/:id/availability', medicineController.getAvailability);
router.post('/consult', medicineController.consultWithAI);

module.exports = router;

