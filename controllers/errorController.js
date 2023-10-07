const globalErrorHandler = (err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    status: err.status || 'fail',
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

module.exports = globalErrorHandler;
