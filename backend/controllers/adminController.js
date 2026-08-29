const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Reservation = require('../models/Reservation');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/search');

// @desc    Dashboard counters
// @route   GET /api/admin/stats
// @access  Admin
const getStats = asyncHandler(async (req, res) => {
  const [users, pharmacies, medicines, categories, reservations, pending, outOfStock] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Pharmacy.countDocuments(),
      Medicine.countDocuments(),
      Category.countDocuments(),
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: 'pending' }),
      Inventory.countDocuments({ stock: 0 }),
    ]);

  const byStatus = await Reservation.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const topMedicines = await Reservation.aggregate([
    { $group: { _id: '$medicine', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'medicines', localField: '_id', foreignField: '_id', as: 'medicine' } },
    { $unwind: '$medicine' },
    { $project: { count: 1, name: '$medicine.name', strength: '$medicine.strength' } },
  ]);

  res.json({
    success: true,
    stats: { users, pharmacies, medicines, categories, reservations, pending, outOfStock },
    reservationsByStatus: byStatus,
    topMedicines,
  });
});

// @desc    Recent system activity
// @route   GET /api/admin/activities
// @access  Admin
const getActivities = asyncHandler(async (req, res) => {
  const [newUsers, newPharmacies, newReservations] = await Promise.all([
    User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
    Pharmacy.find().sort('-createdAt').limit(5).select('name city createdAt'),
    Reservation.find()
      .sort('-createdAt')
      .limit(8)
      .populate('user', 'name')
      .populate('medicine', 'name')
      .populate('pharmacy', 'name'),
  ]);

  const activities = [
    ...newUsers.map((u) => ({
      type: 'user',
      text: `${u.name} registered as ${u.role}`,
      at: u.createdAt,
    })),
    ...newPharmacies.map((p) => ({
      type: 'pharmacy',
      text: `${p.name} joined from ${p.city}`,
      at: p.createdAt,
    })),
    ...newReservations.map((r) => ({
      type: 'reservation',
      text: `${r.user?.name || 'A user'} reserved ${r.medicine?.name || 'a medicine'} at ${
        r.pharmacy?.name || 'a pharmacy'
      } (${r.status})`,
      at: r.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 15);

  res.json({ success: true, activities });
});

// @desc    List users / pharmacy owners
// @route   GET /api/admin/users?role=&search=
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { city: regex }];
  }
  const users = await User.find(filter).sort('-createdAt');
  res.json({ success: true, count: users.length, users });
});

// @desc    Block / unblock a user
// @route   PUT /api/admin/users/:id/status
// @access  Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot change your own account status');
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, message: `Account ${user.status}`, user });
});

// @desc    Delete a user (and the pharmacy data they own)
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'pharmacy') {
    const pharmacy = await Pharmacy.findOne({ owner: user._id });
    if (pharmacy) {
      await Inventory.deleteMany({ pharmacy: pharmacy._id });
      await Pharmacy.findByIdAndDelete(pharmacy._id);
    }
  }
  await Reservation.deleteMany({ user: user._id });
  await User.findByIdAndDelete(user._id);

  res.json({ success: true, message: 'Account and related data deleted' });
});

module.exports = { getStats, getActivities, getUsers, updateUserStatus, deleteUser };
