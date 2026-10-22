export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) return;
  console.error(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: status >= 500 ? 'The server could not complete the request.' : err.message } });
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
