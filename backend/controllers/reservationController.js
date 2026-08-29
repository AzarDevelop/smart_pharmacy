const pool = require('../config/db');

// POST /api/reservations - customer reserves a medicine for pickup
exports.createReservation = async (req, res) => {
  const conn = await pool.getClient();
  try {
    const { pharmacy_id, medicine_id, quantity } = req.body;
    if (!pharmacy_id || !medicine_id) {
      return res.status(400).json({ message: 'pharmacy_id and medicine_id are required.' });
    }
    const qty = quantity || 1;

    await conn.beginTransaction();

    const [stockRows] = await conn.query(
      'SELECT quantity FROM pharmacy_medicines WHERE pharmacy_id = ? AND medicine_id = ? FOR UPDATE',
      [pharmacy_id, medicine_id]
    );

    if (stockRows.length === 0 || stockRows[0].quantity < qty) {
      await conn.rollback();
      return res.status(409).json({ message: 'Not enough stock available at this pharmacy anymore.' });
    }

    const pickupBy = new Date();
    pickupBy.setDate(pickupBy.getDate() + 1); // 24 hour pickup window

    const [result] = await conn.query(
      `INSERT INTO reservations (user_id, pharmacy_id, medicine_id, quantity, status, pickup_by)
       VALUES (?, ?, ?, ?, 'pending', ?) RETURNING reservation_id`,
      [req.user.user_id, pharmacy_id, medicine_id, qty, pickupBy]
    );
    const reservationId = result[0]?.reservation_id || result?.insertId;

    // Soft-hold the stock so it isn't double booked
    await conn.query(
      'UPDATE pharmacy_medicines SET quantity = quantity - ? WHERE pharmacy_id = ? AND medicine_id = ?',
      [qty, pharmacy_id, medicine_id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Medicine reserved. Please collect it within 24 hours.', reservation_id: reservationId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Could not create reservation.' });
  } finally {
    conn.release();
  }
};

// GET /api/reservations/mine
exports.getMyReservations = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, m.name AS medicine_name, p.name AS pharmacy_name, p.address, p.phone
       FROM reservations r
       JOIN medicines m ON r.medicine_id = m.medicine_id
       JOIN pharmacies p ON r.pharmacy_id = p.pharmacy_id
       WHERE r.user_id = ? ORDER BY r.reserved_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch your reservations.' });
  }
};

// PATCH /api/reservations/:id/status  (pharmacy confirms/completes, or user cancels)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    // If cancelling, release the held stock back
    if (status === 'cancelled') {
      const [rows] = await pool.query('SELECT * FROM reservations WHERE reservation_id = ?', [id]);
      if (rows.length > 0 && rows[0].status !== 'cancelled') {
        await pool.query(
          'UPDATE pharmacy_medicines SET quantity = quantity + ? WHERE pharmacy_id = ? AND medicine_id = ?',
          [rows[0].quantity, rows[0].pharmacy_id, rows[0].medicine_id]
        );
      }
    }

    await pool.query('UPDATE reservations SET status = ? WHERE reservation_id = ?', [status, id]);
    res.json({ message: `Reservation marked as ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update reservation status.' });
  }
};
