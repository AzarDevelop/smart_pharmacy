const axios = require('axios');
const pool = require('../config/db');
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/pharmacy  - register/create a pharmacy profile (pharmacy-role user)
exports.createPharmacy = async (req, res) => {
  try {
    const { name, address, city, latitude, longitude, phone } = req.body;
    if (!name || !address || !city) {
      return res.status(400).json({ message: 'Name, address and city are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO pharmacies (owner_id, name, address, city, latitude, longitude, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING pharmacy_id`,
      [req.user.user_id, name, address, city, latitude || null, longitude || null, phone || null]
    );
    const pharmacyId = result[0]?.pharmacy_id || result?.insertId;
    res.status(201).json({ message: 'Pharmacy profile created.', pharmacy_id: pharmacyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create pharmacy profile.' });
  }
};

// GET /api/pharmacy/mine - pharmacies owned by the logged-in pharmacy user
exports.getMyPharmacies = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pharmacies WHERE owner_id = ?', [req.user.user_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch pharmacies.' });
  }
};

// Helper: verify the logged-in user owns this pharmacy
async function assertOwnership(pharmacyId, userId) {
  const [rows] = await pool.query('SELECT owner_id FROM pharmacies WHERE pharmacy_id = ?', [pharmacyId]);
  if (rows.length === 0) return false;
  return rows[0].owner_id === userId;
}

// GET /api/pharmacy/:id/inventory
exports.getInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT pm.stock_id, pm.quantity, pm.price, pm.low_stock_threshold, pm.updated_at,
              m.medicine_id, m.name, m.generic_name, m.category
       FROM pharmacy_medicines pm
       JOIN medicines m ON pm.medicine_id = m.medicine_id
       WHERE pm.pharmacy_id = ?
       ORDER BY m.name`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch inventory.' });
  }
};

// POST /api/pharmacy/:id/inventory - add or update stock for a medicine
exports.upsertStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicine_id, price, quantity, low_stock_threshold } = req.body;

    if (!(await assertOwnership(id, req.user.user_id)) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not manage this pharmacy.' });
    }
    if (!medicine_id || price == null || quantity == null) {
      return res.status(400).json({ message: 'medicine_id, price and quantity are required.' });
    }

    await pool.query(
      `INSERT INTO pharmacy_medicines (pharmacy_id, medicine_id, price, quantity, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (pharmacy_id, medicine_id) DO UPDATE SET
         price = EXCLUDED.price,
         quantity = EXCLUDED.quantity,
         low_stock_threshold = EXCLUDED.low_stock_threshold,
         updated_at = CURRENT_TIMESTAMP`,
      [id, medicine_id, price, quantity, low_stock_threshold || 10]
    );

    // Low stock alert (Module: AI & ML - Low Stock Alerts)
    if (quantity <= (low_stock_threshold || 10)) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'low_stock')`,
        [req.user.user_id, `Stock for medicine ID ${medicine_id} is running low (${quantity} left).`]
      );
    }

    res.json({ message: 'Stock updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update stock.' });
  }
};

// DELETE /api/pharmacy/:id/inventory/:stockId
exports.deleteStock = async (req, res) => {
  try {
    const { id, stockId } = req.params;
    if (!(await assertOwnership(id, req.user.user_id)) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not manage this pharmacy.' });
    }
    await pool.query('DELETE FROM pharmacy_medicines WHERE stock_id = ? AND pharmacy_id = ?', [stockId, id]);
    res.json({ message: 'Stock entry removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove stock entry.' });
  }
};

// GET /api/pharmacy/:id/low-stock - medicines at/below threshold
exports.getLowStock = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT pm.*, m.name, m.generic_name
       FROM pharmacy_medicines pm
       JOIN medicines m ON pm.medicine_id = m.medicine_id
       WHERE pm.pharmacy_id = ? AND pm.quantity <= pm.low_stock_threshold`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch low stock list.' });
  }
};

// GET /api/pharmacy/:id/predict/:medicineId
// Calls the Python AI/ML service (Module 7: Stock Demand Prediction) using this
// pharmacy's historical sales for the given medicine.
exports.predictDemand = async (req, res) => {
  try {
    const { id, medicineId } = req.params;
    const [history] = await pool.query(
      `SELECT sale_date, quantity_sold FROM sales_history
       WHERE pharmacy_id = ? AND medicine_id = ? ORDER BY sale_date ASC`,
      [id, medicineId]
    );

    if (history.length < 3) {
      return res.status(400).json({
        message: 'Not enough sales history yet to generate a reliable prediction (need at least 3 records).'
      });
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict-demand`, {
      history: history.map((h) => ({ date: h.sale_date, quantity: h.quantity_sold }))
    });

    res.json(aiResponse.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate demand prediction right now.' });
  }
};

// POST /api/pharmacy/:id/sales - record a sale (feeds the prediction model)
exports.recordSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicine_id, quantity_sold, sale_date } = req.body;
    if (!medicine_id || !quantity_sold) {
      return res.status(400).json({ message: 'medicine_id and quantity_sold are required.' });
    }
    await pool.query(
      `INSERT INTO sales_history (pharmacy_id, medicine_id, quantity_sold, sale_date)
       VALUES (?, ?, ?, ?)`,
      [id, medicine_id, quantity_sold, sale_date || new Date().toISOString().slice(0, 10)]
    );
    // Reduce live stock accordingly
    await pool.query(
      `UPDATE pharmacy_medicines SET quantity = GREATEST(quantity - ?, 0)
       WHERE pharmacy_id = ? AND medicine_id = ?`,
      [quantity_sold, id, medicine_id]
    );
    res.status(201).json({ message: 'Sale recorded.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not record sale.' });
  }
};

// GET /api/pharmacy/:id/reservations
exports.getPharmacyReservations = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS customer_name, u.phone AS customer_phone, m.name AS medicine_name
       FROM reservations r
       JOIN users u ON r.user_id = u.user_id
       JOIN medicines m ON r.medicine_id = m.medicine_id
       WHERE r.pharmacy_id = ? ORDER BY r.reserved_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch reservations.' });
  }
};
