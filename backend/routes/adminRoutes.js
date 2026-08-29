const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getActivities,
  getUsers,
  updateUserStatus,
  deleteUser,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/activities', getActivities);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
