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

// PATCH /api/admin/pharmacies/:id/unverify
exports.unverifyPharmacy = async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE pharmacies SET is_verified = FALSE WHERE pharmacy_id = ?', [id]);
  res.json({ message: 'Pharmacy unverified.' });
};

// DELETE /api/admin/pharmacies/:id
exports.deletePharmacy = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM pharmacies WHERE pharmacy_id = ?', [id]);
  res.json({ message: 'Pharmacy removed.' });
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
  res.json({ message: 'User removed.' });
};

// ============================================================
// MEDICINES MANAGEMENT (Admin CRUD)
// ============================================================

// GET /api/admin/medicines
exports.listMedicines = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, 
             COUNT(DISTINCT pm.pharmacy_id) as pharmacy_count,
             COALESCE(SUM(pm.quantity), 0) as total_stock
      FROM medicines m
      LEFT JOIN pharmacy_medicines pm ON m.medicine_id = pm.medicine_id
      GROUP BY m.medicine_id
      ORDER BY m.medicine_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching admin medicines:', err);
    res.status(500).json({ message: 'Could not fetch medicines catalogue.' });
  }
};

// POST /api/admin/medicines
exports.createMedicine = async (req, res) => {
  try {
    const { name, generic_name, category, manufacturer, description, requires_prescription } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Medicine name is required.' });
    }

    const [rows] = await pool.query(
      `INSERT INTO medicines (name, generic_name, category, manufacturer, description, requires_prescription)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        name.trim(),
        generic_name ? generic_name.trim() : null,
        category ? category.trim() : null,
        manufacturer ? manufacturer.trim() : null,
        description ? description.trim() : null,
        Boolean(requires_prescription)
      ]
    );

    res.status(201).json(rows[0] || { message: 'Medicine created successfully.' });
  } catch (err) {
    console.error('Error creating medicine:', err);
    res.status(500).json({ message: 'Could not add medicine: ' + err.message });
  }
};

// PUT /api/admin/medicines/:id
exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, generic_name, category, manufacturer, description, requires_prescription } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Medicine name is required.' });
    }

    const [rows] = await pool.query(
      `UPDATE medicines
       SET name = ?, generic_name = ?, category = ?, manufacturer = ?, description = ?, requires_prescription = ?
       WHERE medicine_id = ?
       RETURNING *`,
      [
        name.trim(),
        generic_name ? generic_name.trim() : null,
        category ? category.trim() : null,
        manufacturer ? manufacturer.trim() : null,
        description ? description.trim() : null,
        Boolean(requires_prescription),
        id
      ]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating medicine:', err);
    res.status(500).json({ message: 'Could not update medicine: ' + err.message });
  }
};

// DELETE /api/admin/medicines/:id
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM medicines WHERE medicine_id = ?', [id]);
    res.json({ message: 'Medicine deleted successfully.' });
  } catch (err) {
    console.error('Error deleting medicine:', err);
    res.status(500).json({ message: 'Could not delete medicine: ' + err.message });
  }
};

// GET /api/admin/reports/overview - system-wide monitoring dashboard numbers
exports.getOverview = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error getting overview:', err);
    res.status(500).json({ message: 'Could not fetch overview data.' });
  }
};
