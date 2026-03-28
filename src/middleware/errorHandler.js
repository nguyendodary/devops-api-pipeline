const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const config = require('../config/environment');

const errorHandler = (err, req, res, _next) => {
  logger.error(`${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.errors.length && { errors: err.errors }),
      ...(config.env === 'development' && { stack: err.stack }),
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'Duplicate entry found',
        field: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Record not found',
      });
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid data provided',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON payload',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
