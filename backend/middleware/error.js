const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id format';
  }
  if (err.code === 11000) {
    status = 400;
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`;
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
