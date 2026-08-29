const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  city: user.city,
  role: user.role,
  status: user.status,
});

// @desc    Register a customer or a pharmacy
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, city, role = 'user', pharmacy } = req.body;

  if (!['user', 'pharmacy'].includes(role)) {
    res.status(400);
    throw new Error('You can register only as a user or a pharmacy');
  }

  const exists = await User.findOne({ email: (email || '').toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone, address, city, role });

  let pharmacyDoc = null;
  if (role === 'pharmacy') {
    try {
      pharmacyDoc = await Pharmacy.create({
        owner: user._id,
        name: pharmacy?.name || `${name} Pharmacy`,
        licenseNumber: pharmacy?.licenseNumber,
        phone: pharmacy?.phone || phone,
        email: user.email,
        address: pharmacy?.address || address,
        city: pharmacy?.city || city,
        pincode: pharmacy?.pincode || '',
        openingHours: pharmacy?.openingHours || '9:00 AM - 9:00 PM',
        location: {
          type: 'Point',
          coordinates: [
            Number(pharmacy?.longitude) || 80.2707,
            Number(pharmacy?.latitude) || 13.0827,
          ],
        },
      });
    } catch (error) {
      // Roll back the user so we never leave an orphan pharmacy account
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  await notify({
    user: user._id,
    title: 'Welcome to Smart Pharmacy',
    message:
      role === 'pharmacy'
        ? 'Your pharmacy account is ready. Add medicines to your inventory so customers can find you.'
        : 'Your account is ready. Search for a medicine to see which pharmacy has it in stock.',
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id, user.role),
    user: publicUser(user),
    pharmacy: pharmacyDoc,
  });
});

// @desc    Login for all three roles
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Enter both email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Email or password is incorrect');
  }
  if (user.status === 'blocked') {
    res.status(403);
    throw new Error('This account has been blocked by the admin');
  }

  let pharmacyDoc = null;
  if (user.role === 'pharmacy') pharmacyDoc = await Pharmacy.findOne({ owner: user._id });

  res.json({
    success: true,
    token: generateToken(user._id, user.role),
    user: publicUser(user),
    pharmacy: pharmacyDoc,
  });
});

// @desc    Logged-in account details
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  let pharmacyDoc = null;
  if (req.user.role === 'pharmacy') pharmacyDoc = await Pharmacy.findOne({ owner: req.user._id });
  res.json({ success: true, user: publicUser(req.user), pharmacy: pharmacyDoc });
});

// @desc    Update own profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone, address, city } = req.body;

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.address = address ?? user.address;
  user.city = city ?? user.city;
  await user.save();

  res.json({ success: true, message: 'Profile updated', user: publicUser(user) });
});

// @desc    Change own password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
