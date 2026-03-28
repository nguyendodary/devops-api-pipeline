const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.get('/health', async (req, res) => {
  const { prisma } = require('../config/database');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'success',
      message: 'Healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Unhealthy',
      database: 'disconnected',
    });
  }
});

module.exports = router;
