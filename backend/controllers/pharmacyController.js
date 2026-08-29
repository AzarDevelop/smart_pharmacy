const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/search');

// @desc    List pharmacies
// @route   GET /api/pharmacies?search=&city=
// @access  Public
const getPharmacies = asyncHandler(async (req, res) => {
  const { search = '', city = '', all = '' } = req.query;
  // Admin pages pass all=1 so blocked pharmacies stay visible and can be unblocked
  const filter = all ? {} : { status: 'active' };
  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: regex }, { address: regex }, { city: regex }];
  }
  if (city) filter.city = new RegExp(escapeRegex(city), 'i');

  const pharmacies = await Pharmacy.find(filter).sort('name');
  res.json({ success: true, count: pharmacies.length, pharmacies });
});

// @desc    Pharmacies near a coordinate, nearest first
// @route   GET /api/pharmacies/nearby?lat=&lng=&distance=&medicine=
// @access  Public
const getNearbyPharmacies = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat) || 13.0827; // Chennai as the default location
  const lng = Number(req.query.lng) || 80.2707;
  const maxKm = Number(req.query.distance) || 10;

  const results = await Pharmacy.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: maxKm * 1000,
        query: { status: 'active' },
        spherical: true,
      },
    },
    { $limit: 25 },
  ]);

  // Optionally show the stock of one medicine at each nearby pharmacy
  const medicineId = req.query.medicine;
  const pharmacies = await Promise.all(
    results.map(async (p) => {
      const item = {
        ...p,
        distanceKm: Number((p.distanceMeters / 1000).toFixed(2)),
        medicineCount: await Inventory.countDocuments({ pharmacy: p._id, stock: { $gt: 0 } }),
      };
      if (medicineId) {
        const row = await Inventory.findOne({ pharmacy: p._id, medicine: medicineId });
        item.medicineStock = row ? { price: row.price, stock: row.stock } : null;
      }
      return item;
    })
  );

  res.json({ success: true, count: pharmacies.length, center: { lat, lng }, pharmacies });
});

// @desc    Logged-in pharmacy's own profile
// @route   GET /api/pharmacies/me
// @access  Pharmacy
const getMyPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy profile not found');
  }
  res.json({ success: true, pharmacy });
});

// @desc    Update own pharmacy profile
// @route   PUT /api/pharmacies/me
// @access  Pharmacy
const updateMyPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy profile not found');
  }

  const fields = ['name', 'phone', 'address', 'city', 'pincode', 'openingHours'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) pharmacy[f] = req.body[f];
  });
  if (req.body.latitude && req.body.longitude) {
    pharmacy.location = {
      type: 'Point',
      coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
    };
  }
  await pharmacy.save();
  res.json({ success: true, message: 'Pharmacy profile updated', pharmacy });
});

// @desc    Public pharmacy page with its in-stock medicines
// @route   GET /api/pharmacies/:id
// @access  Public
const getPharmacy = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findById(req.params.id);
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy not found');
  }
  const inventory = await Inventory.find({ pharmacy: pharmacy._id })
    .populate('medicine', 'name brandName genericName strength dosageForm')
    .sort('-stock');
  res.json({ success: true, pharmacy, inventory });
});

// @desc    Block / unblock a pharmacy
// @route   PUT /api/pharmacies/:id/status
// @access  Admin
const updatePharmacyStatus = asyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!pharmacy) {
    res.status(404);
    throw new Error('Pharmacy not found');
  }
  res.json({ success: true, message: `Pharmacy ${pharmacy.status}`, pharmacy });
});

module.exports = {
  getPharmacies,
  getNearbyPharmacies,
  getMyPharmacy,
  updateMyPharmacy,
  getPharmacy,
  updatePharmacyStatus,
};
