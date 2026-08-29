const mongoose = require('mongoose');

// Master catalogue of medicines. Stock/price live in the Inventory collection.
const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Medicine name is required'], trim: true },
    brandName: { type: String, trim: true, default: '' },
    genericName: { type: String, trim: true, default: '' },
    manufacturer: { type: String, trim: true, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String, default: '' },
    dosageForm: { type: String, default: 'Tablet' }, // Tablet, Syrup, Capsule, Injection...
    strength: { type: String, default: '' }, // 500mg, 5ml ...
    prescriptionRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index gives us fast keyword search on the three searchable names
medicineSchema.index({ name: 'text', brandName: 'text', genericName: 'text' });
medicineSchema.index({ name: 1, strength: 1 }, { unique: true });

module.exports = mongoose.model('Medicine', medicineSchema);
