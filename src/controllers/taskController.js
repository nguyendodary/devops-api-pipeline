const taskService = require('../services/taskService');

class TaskController {
  async getAll(req, res, next) {
    try {
      const { page, limit, status, priority } = req.query;
      const result = await taskService.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status,
        priority,
        userId: req.user.role === 'ADMIN' ? undefined : req.user.id,
      });
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const task = await taskService.findById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const task = await taskService.create(req.body, req.user.id);
      res.status(201).json({
        status: 'success',
        message: 'Task created successfully',
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const task = await taskService.update(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role === 'ADMIN',
      );
      res.status(200).json({
        status: 'success',
        message: 'Task updated successfully',
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await taskService.delete(req.params.id, req.user.id, req.user.role === 'ADMIN');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
