const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const reelRoutes = require('./routes/reelRoutes');

// Load environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'Instagram Scraper Backend'
  });
});

// Bind API Routes
app.use('/api', reelRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log('=====================================================');
  console.log(`🚀 Instagram Reel Scraper Backend Service running on port ${PORT}`);
  console.log(`👉 POST http://localhost:${PORT}/api/reel/analyze`);
  console.log(`👉 GET  http://localhost:${PORT}/api/scrape?url=...`);
  console.log(`👉 GET  http://localhost:${PORT}/health`);
  console.log('=====================================================');
});

// Handle graceful shutdowns
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down server gracefully...');
  server.close(() => {
    console.log('Server terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down server gracefully...');
  server.close(() => {
    console.log('Server terminated.');
  });
});

module.exports = app; // For testing purposes
