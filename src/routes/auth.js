import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();

router.post('/login', asyncRoute(async (req, res) => {
  const parsed = z.object({ email: z.string().email().max(320), password: z.string().min(1).max(200) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Enter a valid email and password.' } });
  const email = parsed.data.email.trim().toLowerCase();
  const user = await User.findOne({ email, isActive: true }).select('+passwordHash');
  const hash = user?.passwordHash || '$2a$12$7T2VlSsjEAvD3qhGH21XxuhT2VvMKtG7x3n/XcGZ3oFEHw8xJdtUm';
  const matches = await bcrypt.compare(parsed.data.password, hash);
  if (!user || !user.passwordHash || !matches) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
  await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
  req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role, audienceGroup: user.audienceGroup };
  req.session.csrfToken = randomBytes(24).toString('hex');
  await new Promise((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
  res.json({ user: req.session.user, csrfToken: req.session.csrfToken });
}));

router.get('/google', (req, res, next) => {
  req.session.oauthPurpose = 'login';
  req.session.oauthState = randomBytes(24).toString('hex');
  req.session.save(err => err ? next(err) : res.redirect(`/api/google/start?state=${req.session.oauthState}`));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } });
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(24).toString('hex');
  res.json({ user: req.session.user, csrfToken: req.session.csrfToken });
});

router.post('/logout', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  await new Promise((resolve, reject) => req.session.destroy(err => err ? reject(err) : resolve()));
  res.clearCookie('campusai.sid', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ ok: true });
}));

export default router;
