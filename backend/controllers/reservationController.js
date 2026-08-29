const Reservation = require('../models/Reservation');
const Inventory = require('../models/Inventory');
const Pharmacy = require('../models/Pharmacy');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

// @desc    Reserve a medicine for pickup
// @route   POST /api/reservations
// @access  User
const createReservation = asyncHandler(async (req, res) => {
  const { inventoryId, quantity = 1, pickupDate, note = '' } = req.body;

  const item = await Inventory.findById(inventoryId)
    .populate('medicine', 'name strength')
    .populate('pharmacy', 'name owner status');
  if (!item) {
    res.status(404);
    throw new Error('This pharmacy listing no longer exists');
  }
  if (item.pharmacy.status !== 'active') {
    res.status(400);
    throw new Error('This pharmacy is not accepting reservations right now');
  }
  const qty = Number(quantity);
  if (!qty || qty < 1) {
    res.status(400);
    throw new Error('Enter a quantity of at least 1');
  }
  if (item.stock < qty) {
    res.status(400);
    throw new Error(`Only ${item.stock} unit(s) left at this pharmacy`);
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    pharmacy: item.pharmacy._id,
    medicine: item.medicine._id,
    inventory: item._id,
    quantity: qty,
    unitPrice: item.price,
    totalPrice: Number((item.price * qty).toFixed(2)),
    pickupDate: pickupDate || undefined,
    note,
  });

  // Hold the stock so two customers cannot reserve the same last strip
  item.stock -= qty;
  await item.save();

  await notify({
    user: req.user._id,
    title: 'Reservation placed',
    message: `${item.medicine.name} x${qty} is held at ${item.pharmacy.name}. Code: ${reservation.code}`,
    type: 'reservation',
    link: '/user/reservations',
  });
  await notify({
    user: item.pharmacy.owner,
    title: 'New reservation',
    message: `${req.user.name} reserved ${item.medicine.name} x${qty}. Code: ${reservation.code}`,
    type: 'reservation',
    link: '/pharmacy/reservations',
  });

  res.status(201).json({ success: true, message: 'Medicine reserved', reservation });
});

// @desc    Own reservations
// @route   GET /api/reservations/my
// @access  User
const getMyReservations = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const reservations = await Reservation.find(filter)
    .populate('medicine', 'name brandName strength dosageForm')
    .populate('pharmacy', 'name address city phone')
    .sort('-createdAt');
  res.json({ success: true, count: reservations.length, reservations });
});

// @desc    Reservations received by the logged-in pharmacy
// @route   GET /api/reservations/pharmacy
// @access  Pharmacy
const getPharmacyReservations = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy profile not found');
  }
  const filter = { pharmacy: pharmacy._id };
  if (req.query.status) filter.status = req.query.status;

  const reservations = await Reservation.find(filter)
    .populate('medicine', 'name brandName strength dosageForm')
    .populate('user', 'name email phone')
    .sort('-createdAt');
  res.json({ success: true, count: reservations.length, reservations });
});

// @desc    Pharmacy updates a reservation status
// @route   PUT /api/reservations/:id/status
// @access  Pharmacy
const updateReservationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'ready', 'completed', 'rejected'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(', ')}`);
  }

  const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    pharmacy: pharmacy?._id,
  }).populate('medicine', 'name');
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }
  if (['completed', 'cancelled', 'rejected'].includes(reservation.status)) {
    res.status(400);
    throw new Error(`This reservation is already ${reservation.status}`);
  }

  // Rejecting puts the held stock back
  if (status === 'rejected') {
    await Inventory.findByIdAndUpdate(reservation.inventory, {
      $inc: { stock: reservation.quantity },
    });
  }

  reservation.status = status;
  await reservation.save();

  const messages = {
    confirmed: 'Your reservation has been confirmed by the pharmacy.',
    ready: 'Your medicine is packed and ready for pickup.',
    completed: 'Your reservation is marked as picked up. Thank you.',
    rejected: 'The pharmacy could not fulfil your reservation.',
  };
  await notify({
    user: reservation.user,
    title: `Reservation ${status}`,
    message: `${reservation.medicine.name} (${reservation.code}): ${messages[status]}`,
    type: 'reservation',
    link: '/user/reservations',
  });

  res.json({ success: true, message: `Reservation ${status}`, reservation });
});

// @desc    User cancels a reservation
// @route   PUT /api/reservations/:id/cancel
// @access  User
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id })
    .populate('medicine', 'name')
    .populate('pharmacy', 'name owner');
  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }
  if (!['pending', 'confirmed', 'ready'].includes(reservation.status)) {
    res.status(400);
    throw new Error(`A ${reservation.status} reservation cannot be cancelled`);
  }

  await Inventory.findByIdAndUpdate(reservation.inventory, {
    $inc: { stock: reservation.quantity },
  });
  reservation.status = 'cancelled';
  await reservation.save();

  await notify({
    user: reservation.pharmacy.owner,
    title: 'Reservation cancelled',
    message: `${req.user.name} cancelled ${reservation.medicine.name} (${reservation.code}). Stock returned.`,
    type: 'reservation',
    link: '/pharmacy/reservations',
  });

  res.json({ success: true, message: 'Reservation cancelled', reservation });
});

// @desc    All reservations in the system
// @route   GET /api/reservations
// @access  Admin
const getAllReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const reservations = await Reservation.find(filter)
    .populate('medicine', 'name strength')
    .populate('pharmacy', 'name city')
    .populate('user', 'name email')
    .sort('-createdAt');
  res.json({ success: true, count: reservations.length, reservations });
});

module.exports = {
  createReservation,
  getMyReservations,
  getPharmacyReservations,
  updateReservationStatus,
  cancelReservation,
  getAllReservations,
};
