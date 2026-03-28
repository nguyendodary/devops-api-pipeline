const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { UnauthorizedError } = require('./errors');

function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
