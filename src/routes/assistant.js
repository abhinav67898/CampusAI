import { Router } from 'express';
import { z } from 'zod';
import EmailMessage from '../models/EmailMessage.js';
import Notice from '../models/Notice.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
import { findRelevant, generateGroundedAnswer } from '../services/answer.js';

const router = Router();
const inputSchema = z.object({ message: z.string().trim().min(1).max(500), conversationId: z.string().regex(/^[a-f\d]{24}$/i).optional() });

router.post('/ask', requireAuth, requireCsrf, asyncRoute(async (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Provide a message up to 500 characters.' } });
  const { message, conversationId } = parsed.data;
  const studentId = req.session.user.id;
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, studentId });
    if (!conversation) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
  } else {
    conversation = await Conversation.create({ studentId, title: message.slice(0, 80) });
  }
  const history = await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(6).lean();
  history.reverse();
  const now = new Date();
  const audience = ['all', req.session.user.audienceGroup || ''];
  const [notices, emails] = await Promise.all([
    Notice.find({ status: 'published', effectiveFrom: { $lte: now }, expiresAt: { $gt: now }, audience: { $in: audience } }).sort({ effectiveFrom: -1 }).limit(100).lean(),
    EmailMessage.find({ ownerId: studentId, isRelevant: true }).sort({ receivedAt: -1 }).limit(100).lean()
  ]);
  const docs = [
    ...notices.map(doc => ({ id: `notice:${doc.id}`, kind: 'notice', title: doc.title, text: doc.body, date: doc.effectiveFrom, url: null })),
    ...emails.map(doc => ({ id: `email:${doc.id}`, kind: 'email', title: doc.subject || '(No subject)', text: `${doc.from || ''}\n${doc.text || doc.snippet || ''}`, date: doc.receivedAt, url: doc.gmailUrl }))
  ];
  const relevant = findRelevant(message, docs, 8);
  let answer;
  if (!relevant.length) {
    answer = { answer: 'I could not find relevant information in your connected Gmail or the active campus notices. Please confirm with your faculty or campus office.', citedSourceIds: [], needsHumanConfirmation: true };
  } else {
    answer = await generateGroundedAnswer(message, history, relevant);
  }
  const cited = relevant.filter(doc => answer.citedSourceIds.includes(doc.id));
  await Message.create([
    { conversationId: conversation._id, studentId, sender: 'student', text: message },
    { conversationId: conversation._id, studentId, sender: 'assistant', text: answer.answer, sources: cited.map(doc => doc.id), needsHumanConfirmation: answer.needsHumanConfirmation }
  ]);
  conversation.updatedAt = new Date();
  await conversation.save();
  res.json({ answer: answer.answer, sources: cited.map(({ id, kind, title, date, url }) => ({ id, type: kind, title, date, url })), conversationId: conversation.id, needsHumanConfirmation: answer.needsHumanConfirmation });
}));

export default router;
