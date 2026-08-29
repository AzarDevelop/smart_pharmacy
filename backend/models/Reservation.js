const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    pickupDate: { type: Date },
    note: { type: String, default: '' },
    code: { type: String, unique: true }, // shown to the user at the counter
  },
  { timestamps: true }
);

// Short human-readable pickup code, e.g. RSV-8F3A21
reservationSchema.pre('validate', function (next) {
  if (!this.code) {
    this.code = 'RSV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
