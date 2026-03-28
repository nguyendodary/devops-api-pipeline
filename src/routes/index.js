const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const healthRoutes = require('./healthRoutes');

function setupRoutes(app) {
  app.use('/', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/tasks', taskRoutes);
}

module.exports = setupRoutes;
