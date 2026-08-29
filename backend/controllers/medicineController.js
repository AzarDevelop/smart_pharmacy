const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, fuzzyScore, allowedDistance } = require('../utils/search');

// @desc    Search / list medicines (partial, case-insensitive, typo tolerant)
// @route   GET /api/medicines?search=&category=&page=&limit=
// @access  Public
const searchMedicines = asyncHandler(async (req, res) => {
  const { search = '', category = '' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);

  const filter = {};
  if (category) filter.category = category;

  let matchType = 'all';

  if (search.trim()) {
    // Step 1: case-insensitive partial match on name, brand and generic name
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: regex }, { brandName: regex }, { genericName: regex }];
    matchType = 'partial';
  }

  let medicines = await Medicine.find(filter).populate('category', 'name').sort('name');

  // Step 2: nothing matched -> retry with spelling-tolerant (fuzzy) matching
  if (search.trim() && medicines.length === 0) {
    const pool = await Medicine.find(category ? { category } : {}).populate('category', 'name');
    const maxDistance = allowedDistance(search);
    medicines = pool
      .map((med) => ({
        med,
        score: Math.min(
          fuzzyScore(search, med.name),
          fuzzyScore(search, med.brandName),
          fuzzyScore(search, med.genericName)
        ),
      }))
      .filter((item) => item.score <= maxDistance)
      .sort((a, b) => a.score - b.score)
      .map((item) => item.med);
    matchType = medicines.length ? 'fuzzy' : 'none';
  }

  const total = medicines.length;
  const paged = medicines.slice((page - 1) * limit, page * limit);

  // Attach a quick availability summary so the results list is useful on its own
  const results = await Promise.all(
    paged.map(async (med) => {
      const stats = await Inventory.aggregate([
        { $match: { medicine: med._id, stock: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            pharmacyCount: { $sum: 1 },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            totalStock: { $sum: '$stock' },
          },
        },
      ]);
      const s = stats[0] || { pharmacyCount: 0, minPrice: null, maxPrice: null, totalStock: 0 };
      return {
        ...med.toObject(),
        availability: {
          pharmacyCount: s.pharmacyCount,
          minPrice: s.minPrice,
          maxPrice: s.maxPrice,
          totalStock: s.totalStock,
          available: s.pharmacyCount > 0,
        },
      };
    })
  );

  res.json({
    success: true,
    matchType,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    medicines: results,
  });
});

// @desc    Single medicine with full pharmacy-wise availability
// @route   GET /api/medicines/:id?lat=&lng=
// @access  Public
const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate('category', 'name');
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  const inventory = await Inventory.find({ medicine: medicine._id })
    .populate({
      path: 'pharmacy',
      match: { status: 'active' },
      select: 'name address city phone openingHours location',
    })
    .sort('price');

  const { lat, lng } = req.query;
  const availability = inventory
    .filter((row) => row.pharmacy)
    .map((row) => {
      const item = row.toObject();
      if (lat && lng) item.distanceKm = distanceInKm(Number(lat), Number(lng), row.pharmacy.location);
      return item;
    });

  res.json({ success: true, medicine, availability });
});

// Straight-line (haversine) distance, good enough for a mini project
function distanceInKm(lat, lng, location) {
  if (!location?.coordinates?.length) return null;
  const [pLng, pLat] = location.coordinates;
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(pLat - lat);
  const dLng = toRad(pLng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(pLat)) * Math.sin(dLng / 2) ** 2;
  return Number((2 * R * Math.asin(Math.sqrt(a))).toFixed(2));
}

// @desc    Add a medicine to the master catalogue
// @route   POST /api/medicines
// @access  Pharmacy or Admin
const createMedicine = asyncHandler(async (req, res) => {
  const { name, strength = '' } = req.body;
  const existing = await Medicine.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    strength,
  });
  if (existing) {
    res.status(400);
    throw new Error('This medicine already exists in the catalogue');
  }
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ success: true, message: 'Medicine added to catalogue', medicine });
});

// @desc    Update a catalogue medicine
// @route   PUT /api/medicines/:id
// @access  Admin
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }
  res.json({ success: true, message: 'Medicine updated', medicine });
});

// @desc    Delete a catalogue medicine (and every pharmacy listing of it)
// @route   DELETE /api/medicines/:id
// @access  Admin
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndDelete(req.params.id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }
  await Inventory.deleteMany({ medicine: medicine._id });
  res.json({ success: true, message: 'Medicine and its stock entries deleted' });
});

module.exports = {
  searchMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
