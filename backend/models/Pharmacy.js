const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema(
  {
    // Login account that owns this pharmacy (role = 'pharmacy')
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: [true, 'Pharmacy name is required'], trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true, default: '' },
    openingHours: { type: String, default: '9:00 AM - 9:00 PM' },
    // GeoJSON point -> [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [80.2707, 13.0827] },
    },
    isApproved: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  },
  { timestamps: true }
);

// Required for the "nearby pharmacies" geo query
pharmacySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
