const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const asyncHandler = require('../utils/asyncHandler');

// @desc    List all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ success: true, count: categories.length, categories });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({
    name: req.body.name,
    description: req.body.description || '',
  });
  res.status(201).json({ success: true, message: 'Category created', category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, description: req.body.description },
    { new: true, runValidators: true }
  );
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, message: 'Category updated', category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Medicine.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${inUse} medicine(s) still use this category`);
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
