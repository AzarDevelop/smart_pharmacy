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
  const [[userRow]] = await pool.query('SELECT COUNT(*) AS "userCount" FROM users');
  const [[pharmacyRow]] = await pool.query('SELECT COUNT(*) AS "pharmacyCount" FROM pharmacies');
  const [[medicineRow]] = await pool.query('SELECT COUNT(*) AS "medicineCount" FROM medicines');
  const [[reservationRow]] = await pool.query('SELECT COUNT(*) AS "reservationCount" FROM reservations');
  const [[lowStockRow]] = await pool.query(
    'SELECT COUNT(*) AS "lowStockCount" FROM pharmacy_medicines WHERE quantity <= low_stock_threshold'
  );
  res.json({
    userCount: parseInt(userRow?.userCount || 0, 10),
    pharmacyCount: parseInt(pharmacyRow?.pharmacyCount || 0, 10),
    medicineCount: parseInt(medicineRow?.medicineCount || 0, 10),
    reservationCount: parseInt(reservationRow?.reservationCount || 0, 10),
    lowStockCount: parseInt(lowStockRow?.lowStockCount || 0, 10)
  });
};
