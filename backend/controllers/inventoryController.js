const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const Reservation = require('../models/Reservation');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');
const { escapeRegex } = require('../utils/search');

// Every pharmacy route works on the pharmacy owned by the logged-in account
const myPharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy profile not found');
  }
  return pharmacy;
};

// @desc    Own inventory list
// @route   GET /api/inventory?search=
// @access  Pharmacy
const getInventory = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  let rows = await Inventory.find({ pharmacy: pharmacy._id })
    .populate('medicine', 'name brandName genericName strength dosageForm category')
    .sort('-updatedAt');

  const search = (req.query.search || '').trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    rows = rows.filter(
      (r) =>
        regex.test(r.medicine?.name || '') ||
        regex.test(r.medicine?.brandName || '') ||
        regex.test(r.medicine?.genericName || '')
    );
  }
  res.json({ success: true, count: rows.length, inventory: rows });
});

// @desc    Items at or below their low-stock limit
// @route   GET /api/inventory/low-stock
// @access  Pharmacy
const getLowStock = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  const rows = await Inventory.find({
    pharmacy: pharmacy._id,
    $expr: { $lte: ['$stock', '$lowStockLimit'] },
  })
    .populate('medicine', 'name brandName strength dosageForm')
    .sort('stock');
  res.json({ success: true, count: rows.length, inventory: rows });
});

// @desc    Numbers for the pharmacy dashboard
// @route   GET /api/inventory/stats
// @access  Pharmacy
const getStats = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  const [totalItems, outOfStock, lowStock, pendingReservations, totalReservations] =
    await Promise.all([
      Inventory.countDocuments({ pharmacy: pharmacy._id }),
      Inventory.countDocuments({ pharmacy: pharmacy._id, stock: 0 }),
      Inventory.countDocuments({
        pharmacy: pharmacy._id,
        stock: { $gt: 0 },
        $expr: { $lte: ['$stock', '$lowStockLimit'] },
      }),
      Reservation.countDocuments({ pharmacy: pharmacy._id, status: 'pending' }),
      Reservation.countDocuments({ pharmacy: pharmacy._id }),
    ]);

  const value = await Inventory.aggregate([
    { $match: { pharmacy: pharmacy._id } },
    { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock'] } } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalItems,
      inStock: totalItems - outOfStock,
      outOfStock,
      lowStock,
      pendingReservations,
      totalReservations,
      stockValue: Math.round(value[0]?.total || 0),
    },
  });
});

// @desc    Single inventory row (for the edit page)
// @route   GET /api/inventory/:id
// @access  Pharmacy
const getInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  const row = await Inventory.findOne({ _id: req.params.id, pharmacy: pharmacy._id }).populate(
    'medicine'
  );
  if (!row) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  res.json({ success: true, item: row });
});

// @desc    Add a medicine to own inventory (existing catalogue item or a brand new one)
// @route   POST /api/inventory
// @access  Pharmacy
const addInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  const { medicineId, newMedicine, price, stock, lowStockLimit, batchNumber, expiryDate } = req.body;

  let medicine;
  if (medicineId) {
    medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      res.status(404);
      throw new Error('Selected medicine was not found in the catalogue');
    }
  } else if (newMedicine?.name) {
    medicine = await Medicine.findOne({
      name: new RegExp(`^${escapeRegex(newMedicine.name)}$`, 'i'),
      strength: newMedicine.strength || '',
    });
    if (!medicine) medicine = await Medicine.create(newMedicine);
  } else {
    res.status(400);
    throw new Error('Choose a medicine from the catalogue or enter a new one');
  }

  const exists = await Inventory.findOne({ pharmacy: pharmacy._id, medicine: medicine._id });
  if (exists) {
    res.status(400);
    throw new Error('This medicine is already in your inventory. Edit it instead.');
  }

  const item = await Inventory.create({
    pharmacy: pharmacy._id,
    medicine: medicine._id,
    price,
    stock,
    lowStockLimit: lowStockLimit ?? 10,
    batchNumber: batchNumber || '',
    expiryDate: expiryDate || undefined,
  });

  await item.populate('medicine', 'name strength dosageForm');
  res.status(201).json({ success: true, message: 'Medicine added to inventory', item });
});

// @desc    Update price / stock / limits
// @route   PUT /api/inventory/:id
// @access  Pharmacy
const updateInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  const item = await Inventory.findOne({ _id: req.params.id, pharmacy: pharmacy._id }).populate(
    'medicine',
    'name strength'
  );
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  const wasOutOfStock = item.stock === 0;
  ['price', 'stock', 'lowStockLimit', 'batchNumber', 'expiryDate'].forEach((f) => {
    if (req.body[f] !== undefined && req.body[f] !== '') item[f] = req.body[f];
  });
  await item.save();

  // Tell the pharmacy owner when stock has dropped to the alert level
  if (item.stock > 0 && item.stock <= item.lowStockLimit) {
    await notify({
      user: req.user._id,
      title: 'Low stock alert',
      message: `${item.medicine.name} ${item.medicine.strength} is down to ${item.stock} unit(s).`,
      type: 'stock',
      link: '/pharmacy/low-stock',
    });
  }

  // Let users who wanted it know that it is back
  if (wasOutOfStock && item.stock > 0) {
    const waiting = await Reservation.find({
      medicine: item.medicine._id,
      pharmacy: pharmacy._id,
      status: 'pending',
    }).distinct('user');
    await Promise.all(
      waiting.map((userId) =>
        notify({
          user: userId,
          title: 'Back in stock',
          message: `${item.medicine.name} is available again at ${pharmacy.name}.`,
          type: 'stock',
          link: '/user/reservations',
        })
      )
    );
  }

  res.json({ success: true, message: 'Inventory updated', item });
});

// @desc    Remove a medicine from own inventory
// @route   DELETE /api/inventory/:id
// @access  Pharmacy
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await myPharmacy(req, res);
  const item = await Inventory.findOneAndDelete({ _id: req.params.id, pharmacy: pharmacy._id });
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  res.json({ success: true, message: 'Medicine removed from inventory' });
});

module.exports = {
  getInventory,
  getLowStock,
  getStats,
  getInventoryItem,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};
