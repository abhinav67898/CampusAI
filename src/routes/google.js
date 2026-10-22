import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import User from '../models/User.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
import { createGoogleAuthUrl, exchangeCode, googleProfile, revokeGoogleToken } from '../services/google.js';
import { decryptSecret, encryptSecret } from '../services/crypto.js';

const router = Router();
function allowedDomain(email) {
  const domain = email.toLowerCase().split('@')[1] || '';
  const required = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase();
  return domain.endsWith('.edu') && (!required || domain === required || domain.endsWith(`.${required}`));
}

router.get('/start', (req, res, next) => {
  if (!req.query.state || req.query.state !== req.session.oauthState) return res.status(400).send('Invalid Google sign-in state. Start again from the app.');
  try { res.redirect(createGoogleAuthUrl(req.session.oauthState)); } catch (err) { next(err); }
});

router.post('/connect', requireAuth, requireCsrf, (req, res, next) => {
  req.session.oauthPurpose = 'connect';
  req.session.oauthState = randomBytes(24).toString('hex');
  const url = `/api/google/start?state=${req.session.oauthState}`;
  req.session.save(err => err ? next(err) : res.json({ url }));
});

router.get('/callback', asyncRoute(async (req, res) => {
  if (req.query.error) return res.status(400).send('Google authorization was cancelled or denied. Return to CampusAI and try again.');
  const state = String(req.query.state || '');
  if (!state || state !== req.session.oauthState) return res.status(400).send('Invalid sign-in state. Start again from CampusAI.');
  const purpose = req.session.oauthPurpose;
  delete req.session.oauthState;
  delete req.session.oauthPurpose;
  const tokens = await exchangeCode(String(req.query.code || ''));
  if (!tokens.access_token) return res.status(502).send('Google did not return an access token.');
  const profile = await googleProfile(tokens.access_token);
  const email = String(profile.email || '').toLowerCase();
  if (!profile.email_verified || !allowedDomain(email)) return res.status(403).send('Use a verified .edu email address allowed by this CampusAI setup.');

  let user;
  if (purpose === 'connect' && req.session.user) {
    user = await User.findById(req.session.user.id);
    if (!user) return res.status(401).send('Your CampusAI account was not found. Sign in again.');
    const linked = await User.findOne({ googleSub: profile.sub, _id: { $ne: user._id } });
    if (linked) return res.status(409).send('That Google account is already linked to another CampusAI account.');
    user.googleSub = profile.sub;
  } else {
    user = await User.findOne({ email });
    if (!user) user = new User({ email, name: profile.name || email.split('@')[0], role: 'student', googleSub: profile.sub });
    if (user.googleSub && user.googleSub !== profile.sub) return res.status(409).send('This email belongs to a different Google account.');
    user.googleSub = profile.sub;
  }
  if (!user.isActive) return res.status(403).send('This CampusAI account is disabled. Contact your administrator.');
  if (tokens.refresh_token) user.gmailRefreshToken = encryptSecret(tokens.refresh_token);
  user.gmailConnectedAt = new Date();
  await user.save();

  if (purpose !== 'connect' || !req.session.user) {
    await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role, audienceGroup: user.audienceGroup };
    req.session.csrfToken = randomBytes(24).toString('hex');
  }
  await new Promise((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
  res.redirect(`${process.env.APP_ORIGIN || 'http://localhost:3000'}/?login=success`);
}));

router.delete('/disconnect', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const user = await User.findById(req.session.user.id).select('+gmailRefreshToken');
  if (user?.gmailRefreshToken) await revokeGoogleToken(decryptSecret(user.gmailRefreshToken));
  if (user) {
    user.gmailRefreshToken = undefined;
    user.gmailConnectedAt = null;
    await user.save();
  }
  res.json({ ok: true, message: 'Gmail was disconnected.' });
}));

export default router;
