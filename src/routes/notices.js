import { Router } from 'express';
import { z } from 'zod';
import Notice from '../models/Notice.js';
import { requireAuth, requireCsrf, requireRole } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
const categories = ['schedule', 'event', 'club', 'exam', 'deadline', 'other'];
const noticeInput = z.object({ title: z.string().trim().min(3).max(200), body: z.string().trim().min(10).max(20000), category: z.enum(categories).default('other'), audience: z.string().trim().max(100).default('all'), effectiveFrom: z.coerce.date().optional(), expiresAt: z.coerce.date() });

router.get('/', requireAuth, asyncRoute(async (req, res) => {
  const now = new Date();
  const query = { status: 'published', effectiveFrom: { $lte: now }, expiresAt: { $gt: now } };
  if (!['teacher', 'admin'].includes(req.session.user.role)) query.audience = { $in: ['all', req.session.user.audienceGroup || ''] };
  if (req.query.q) query.$text = { $search: String(req.query.q).slice(0, 100) };
  const notices = await Notice.find(query).sort({ effectiveFrom: -1 }).limit(100).lean();
  res.json({ notices });
}));

router.post('/', requireAuth, requireCsrf, requireRole('teacher', 'admin'), asyncRoute(async (req, res) => {
  const parsed = noticeInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Check the notice fields and dates.', fields: parsed.error.flatten().fieldErrors } });
  const data = parsed.data;
  const effectiveFrom = data.effectiveFrom || new Date();
  if (data.expiresAt <= effectiveFrom) return res.status(400).json({ error: { code: 'INVALID_DATES', message: 'Expiry must be after the effective date.' } });
  const notice = await Notice.create({ ...data, effectiveFrom, createdBy: req.session.user.id });
  res.status(201).json({ notice });
}));

router.patch('/:id/archive', requireAuth, requireCsrf, requireRole('teacher', 'admin'), asyncRoute(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.session.user.role !== 'admin') query.createdBy = req.session.user.id;
  const notice = await Notice.findOneAndUpdate(query, { $set: { status: 'archived' } }, { new: true });
  if (!notice) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notice not found.' } });
  res.json({ notice });
}));

export default router;
