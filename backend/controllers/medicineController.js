const axios = require('axios');
const pool = require('../config/db');
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Haversine formula - distance in km between two lat/lng points
function distanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/medicines
// Plain listing of the medicine catalogue
exports.listMedicines = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicines ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch medicines.' });
  }
};

// GET /api/medicines/search?query=...&lat=..&lng=..
// This is the core "AI-powered search" endpoint used by Module 3 (User) & Module 4 (AI/ML).
// It calls the Python AI/ML micro-service to resolve a free-text, possibly misspelled
// query into the closest matching medicine name(s) using NLP, then joins that against
// live stock across pharmacies, sorted by distance.
exports.searchMedicine = async (req, res) => {
  try {
    const { query, lat, lng } = req.query;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Please enter a medicine name to search.' });
    }

    // 1. Get the full medicine catalogue names to hand to the NLP matcher
    const [catalogue] = await pool.query('SELECT medicine_id, name, generic_name FROM medicines');

    let matchedIds = [];
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/nlp-search`, {
        query,
        catalogue: catalogue.map((m) => ({
          id: m.medicine_id,
          name: m.name,
          generic_name: m.generic_name
        }))
      });
      matchedIds = aiResponse.data.matches.map((m) => m.id);
    } catch (aiErr) {
      // Fallback: simple SQL LIKE search if the AI service is unreachable
      console.warn('AI service unavailable, falling back to basic search:', aiErr.message);
      const [fallback] = await pool.query(
        'SELECT medicine_id FROM medicines WHERE name LIKE ? OR generic_name LIKE ?',
        [`%${query}%`, `%${query}%`]
      );
      matchedIds = fallback.map((m) => m.medicine_id);
    }

    if (matchedIds.length === 0) {
      return res.json({ query, results: [] });
    }

    // 2. Join matched medicines against pharmacy stock
    const placeholders = matchedIds.map(() => '?').join(',');
    const [stockRows] = await pool.query(
      `SELECT pm.stock_id, pm.quantity, pm.price, pm.updated_at,
              m.medicine_id, m.name AS medicine_name, m.generic_name, m.requires_prescription,
              p.pharmacy_id, p.name AS pharmacy_name, p.address, p.city, p.phone,
              p.latitude, p.longitude
       FROM pharmacy_medicines pm
       JOIN medicines m ON pm.medicine_id = m.medicine_id
       JOIN pharmacies p ON pm.pharmacy_id = p.pharmacy_id
       WHERE pm.medicine_id IN (${placeholders}) AND pm.quantity > 0`,
      matchedIds
    );

    // 3. Attach distance (if user location provided) and sort
    const results = stockRows.map((row) => ({
      ...row,
      distance_km: lat && lng ? distanceKm(parseFloat(lat), parseFloat(lng), row.latitude, row.longitude) : null
    }));

    results.sort((a, b) => {
      if (a.distance_km == null || b.distance_km == null) return 0;
      return a.distance_km - b.distance_km;
    });

    res.json({ query, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while searching for medicines.' });
  }
};

// GET /api/medicines/:id/availability
// All pharmacies stocking a specific medicine
exports.getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    const [rows] = await pool.query(
      `SELECT pm.quantity, pm.price, p.pharmacy_id, p.name AS pharmacy_name,
              p.address, p.city, p.phone, p.latitude, p.longitude
       FROM pharmacy_medicines pm
       JOIN pharmacies p ON pm.pharmacy_id = p.pharmacy_id
       WHERE pm.medicine_id = ? AND pm.quantity > 0`,
      [id]
    );

    const results = rows.map((row) => ({
      ...row,
      distance_km: lat && lng ? distanceKm(parseFloat(lat), parseFloat(lng), row.latitude, row.longitude) : null
    }));
    results.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch availability.' });
  }
};
