const userService = require('../services/userService');

class UserController {
  async getAll(req, res, next) {
    try {
      const { page, limit, search, role } = req.query;
      const result = await userService.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        role,
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
      const user = await userService.findById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
