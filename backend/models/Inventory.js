const mongoose = require('mongoose');

// One row = one medicine stocked by one pharmacy
const inventorySchema = new mongoose.Schema(
  {
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockLimit: { type: Number, default: 10, min: 0 },
    batchNumber: { type: String, default: '' },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

// A pharmacy can list a medicine only once
inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });

// Virtual status used by the UI badges
inventorySchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) return 'out-of-stock';
  if (this.stock <= this.lowStockLimit) return 'low-stock';
  return 'in-stock';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
