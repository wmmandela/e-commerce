const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-device-name']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check & Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SokoBora Kenya E-Commerce API',
    location: 'Nairobi, Kenya',
    currency: 'KES (Kenyan Shilling)',
    framework: 'Express + SQLite3',
    timestamp: new Date().toISOString(),
    features: [
      'Kenyan User Authentication (JWT)',
      'Kenyan Product Catalogue & KEBS Verification',
      'Database-Synced Multi-Device Shopping Cart',
      'Order Placement & Inventory Management',
      'M-PESA mobile payments',
      'Multi-Device Active Sessions Tracker across Kenya'
    ]
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Hakuna huduma: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Vercel imports the Express app as a function; local development starts a listener.
const ready = initDb();

if (require.main === module) {
  ready
    .then(() => {
      app.listen(PORT, () => {
        console.log(`================================================================`);
        console.log(` 🇰🇪 SokoBora Kenya API Server running on http://localhost:${PORT}`);
        console.log(` Health check: http://localhost:${PORT}/api/health`);
        console.log(`================================================================`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = app;
module.exports.ready = ready;
