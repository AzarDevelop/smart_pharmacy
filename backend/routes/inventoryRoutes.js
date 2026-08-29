const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getInventory,
  getLowStock,
  getStats,
  getInventoryItem,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');

// Every route below is for the logged-in pharmacy only
router.use(protect, authorize('pharmacy'));

router.get('/', getInventory);
router.post('/', addInventoryItem);
router.get('/low-stock', getLowStock);
router.get('/stats', getStats);
router
  .route('/:id')
  .get(getInventoryItem)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

module.exports = router;
