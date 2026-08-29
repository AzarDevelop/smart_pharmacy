const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  searchMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');

router.get('/', searchMedicines);
router.post('/', protect, authorize('pharmacy', 'admin'), createMedicine);
router.get('/:id', getMedicine);
router.put('/:id', protect, authorize('admin'), updateMedicine);
router.delete('/:id', protect, authorize('admin'), deleteMedicine);

module.exports = router;
