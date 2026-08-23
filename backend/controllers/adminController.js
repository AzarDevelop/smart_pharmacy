const pool = require('../config/db');

// GET /api/admin/users
exports.listUsers = async (req, res) => {
  const [rows] = await pool.query('SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
};

// GET /api/admin/pharmacies
exports.listPharmacies = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, u.name AS owner_name, u.email AS owner_email
     FROM pharmacies p JOIN users u ON p.owner_id = u.user_id
     ORDER BY p.created_at DESC`
  );
  res.json(rows);
};

// PATCH /api/admin/pharmacies/:id/verify
exports.verifyPharmacy = async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE pharmacies SET is_verified = TRUE WHERE pharmacy_id = ?', [id]);
  res.json({ message: 'Pharmacy verified.' });
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
  res.json({ message: 'User removed.' });
};

// GET /api/admin/reports/overview - system-wide monitoring dashboard numbers
exports.getOverview = async (req, res) => {
  const [[{ userCount }]] = await pool.query('SELECT COUNT(*) AS userCount FROM users');
  const [[{ pharmacyCount }]] = await pool.query('SELECT COUNT(*) AS pharmacyCount FROM pharmacies');
  const [[{ medicineCount }]] = await pool.query('SELECT COUNT(*) AS medicineCount FROM medicines');
  const [[{ reservationCount }]] = await pool.query('SELECT COUNT(*) AS reservationCount FROM reservations');
  const [[{ lowStockCount }]] = await pool.query(
    'SELECT COUNT(*) AS lowStockCount FROM pharmacy_medicines WHERE quantity <= low_stock_threshold'
  );
  res.json({ userCount, pharmacyCount, medicineCount, reservationCount, lowStockCount });
};
