export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist on RouteMind AI API`
    }
  });
}
