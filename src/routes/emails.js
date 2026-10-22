import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import EmailMessage from '../models/EmailMessage.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
import { syncMailbox } from '../services/email.js';

const router = Router();
router.get('/', requireAuth, asyncRoute(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = { ownerId: req.session.user.id };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.q) filter.$text = { $search: String(req.query.q).slice(0, 100) };
  const emails = await EmailMessage.find(filter).sort({ receivedAt: -1 }).skip((page - 1) * limit).limit(limit).select('-text').lean();
  res.json({ emails, page, limit });
}));

router.post('/sync', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const parsed = z.object({ limit: z.number().int().min(1).max(50).optional() }).safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'limit must be between 1 and 50.' } });
  const user = await User.findById(req.session.user.id).select('+gmailRefreshToken');
  if (!user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in again.' } });
  const { messages, scanned } = await syncMailbox(user, parsed.data.limit);
  if (messages.length) await EmailMessage.bulkWrite(messages.map(message => ({ updateOne: { filter: { ownerId: user._id, gmailId: message.gmailId }, update: { $set: { ...message, ownerId: user._id } }, upsert: true } })), { ordered: false });
  res.json({ ok: true, scanned, imported: messages.length, message: 'Recent Gmail messages were synced.' });
}));

router.patch('/:id/relevance', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const parsed = z.object({ isRelevant: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'isRelevant must be true or false.' } });
  const email = await EmailMessage.findOneAndUpdate({ _id: req.params.id, ownerId: req.session.user.id }, { $set: parsed.data }, { new: true }).select('-text');
  if (!email) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Email not found.' } });
  res.json({ email });
}));

export default router;
