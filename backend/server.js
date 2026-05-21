/**
 * India Market Dashboard — Backend Server
 *
 * Express server that:
 *   - Serves /api/nifty (live NSE data)
 *   - Runs an internal poller during market hours
 *   - Returns cached data when the market is closed
 *   - Serves a health-check at /
 *
 * Start:  npm run dev    (nodemon, hot-reload)
 *         npm start      (production)
 */

// ── 1. Environment ────────────────────────────────────────
require('dotenv').config();

// ── 2. Dependencies ───────────────────────────────────────
const express = require('express');
const cors = require('cors');

const niftyRoutes = require('./routes/nifty');
const globalRoutes = require('./routes/global');
const bseRoutes = require('./routes/bse');
const forexRoutes = require('./routes/forex');
const bondsRoutes = require('./routes/bonds');
const rbiRoutes = require('./routes/rbi');
const commoditiesRoutes = require('./routes/commodities');
const { startPolling } = require('./services/poller');
const { getMarketStatus } = require('./utils/marketHours');

// ── 3. Express app ────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── 4. Middleware ──────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET'],
}));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

// ── 5. Routes ─────────────────────────────────────────────

// Health-check
  app.get('/', (_req, res) => {
    res.json({
      service: 'India Market Dashboard API',
      status: 'running',
      marketStatus: getMarketStatus(),
      endpoints: {
        nifty: '/api/nifty',
        niftyHistory: '/api/nifty/history',
        global: '/api/global',
        bse: '/api/bse',
        forex: '/api/forex',
        bonds: '/api/bonds',
        rbi: '/api/rbi',
        commodities: '/api/commodities',
      },
    });
  });

  // NIFTY indices (live + history)
  app.use('/api/nifty', niftyRoutes);

  // Global indices
  app.use('/api/global', globalRoutes);

  // BSE / Sensex indices
  app.use('/api/bse', bseRoutes);

  // Forex (INR pairs)
  app.use('/api/forex', forexRoutes);

  // Bonds & Treasury yields
  app.use('/api/bonds', bondsRoutes);

  // RBI policy rates
  app.use('/api/rbi', rbiRoutes);

  // Commodities (Yahoo Finance)
  app.use('/api/commodities', commoditiesRoutes);

// ── 6. 404 handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── 7. Global error handler ──────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ── 8. Process-level error handlers ──────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
});

// ── 9. Start ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Market status: ${getMarketStatus().label}`);

  // Start the NSE poller (respects market hours internally)
  startPolling();
});
