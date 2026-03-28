const { ZodError } = require('zod');
const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const data = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = data.body || req.body;
      req.query = data.query || req.query;
      req.params = data.params || req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError(errors));
      }
      next(error);
    }
  };
};

module.exports = validate;
