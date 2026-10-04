const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const catalogRoutes = require('./routes/catalog.routes');

const app = express();

// 1. CORS Configuration (Section 6)
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. JSON Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request Logging in Development
if (config.nodeEnv !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// 4. API Routes
app.use('/api', catalogRoutes);

// Root greeting / info
app.get('/', (req, res) => {
  res.json({
    service: 'Commerce Hub Backend API',
    endpoints: {
      catalog: '/api/catalog',
      products: '/api/products',
      categories: '/api/categories',
      health: '/api/health',
      analyticsTrack: '/api/analytics/track'
    }
  });
});

// 5. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 6. Centralized Error Handler (Section 22)
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err);

  let statusCode = err.statusCode || 500;
  let clientMessage = err.message || 'Internal Server Error';

  // Handle specific known error scenarios
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    clientMessage = 'Invalid JSON payload received';
  } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Redis')) {
    statusCode = 503;
    clientMessage = 'Catalog cache service temporarily unavailable';
  }

  const responsePayload = {
    error: clientMessage,
    statusCode
  };

  // Only expose stack traces in local development
  if (config.nodeEnv === 'development') {
    responsePayload.details = err.stack;
  }

  res.status(statusCode).json(responsePayload);
});

module.exports = app;
