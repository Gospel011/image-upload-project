
const globalErrorHandler = (err, req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
          status: err.status,
          error: err,
          message: err.message,
          stack: err.stack
        });
      }
}

module.exports = globalErrorHandler;