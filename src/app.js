require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/environment');
const setupRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { NotFoundError } = require('./utils/errors');
const logger = require('./utils/logger');
const swaggerDocument = require('./config/swagger');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.cors.origin === '*' ? '*' : config.cors.origin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env !== 'test') {
  app.use(
    morgan('short', {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

app.use(rateLimiter);

// Static files (dashboard)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Swagger API docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DevOps API Docs',
  }),
);

setupRoutes(app);

app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
