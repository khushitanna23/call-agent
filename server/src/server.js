const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint (Section 37 requirement)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vedanco AI API is running',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Modular Routes (Section 27 requirement)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/knowledge', require('./routes/knowledgeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/integrations', require('./routes/integrationRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/demo', require('./routes/demoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found - ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 VEDANCO AI Backend Server Running on Port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
});

module.exports = app;
