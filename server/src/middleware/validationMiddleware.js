export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid input data: ${details}`,
            details: err.errors
          }
        });
      }
      next(err);
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid query parameters: ${details}`
          }
        });
      }
      next(err);
    }
  };
}
