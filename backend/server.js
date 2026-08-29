require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Pharmacy API is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/pharmacies', require('./routes/pharmacyRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
