export function requireAuth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } });
    if (!roles.includes(req.session.user.role)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission for this action.' } });
    next();
  };
}

export function requireCsrf(req, res, next) {
  const supplied = req.get('x-csrf-token');
  if (!supplied || supplied !== req.session?.csrfToken) return res.status(403).json({ error: { code: 'CSRF_INVALID', message: 'Refresh the page and try again.' } });
  next();
}
