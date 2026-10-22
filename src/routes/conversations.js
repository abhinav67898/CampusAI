import { Router } from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import EmailMessage from '../models/EmailMessage.js';
import Notice from '../models/Notice.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
router.get('/', requireAuth, asyncRoute(async (req, res) => {
  const conversations = await Conversation.find({ studentId: req.session.user.id }).sort({ updatedAt: -1 }).limit(30).lean();
  res.json({ conversations });
}));

router.get('/:id/messages', requireAuth, asyncRoute(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, studentId: req.session.user.id });
  if (!conversation) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found.' } });
  const messages = await Message.find({ conversationId: conversation._id, studentId: req.session.user.id }).sort({ createdAt: 1 }).lean();
  const ids = messages.flatMap(message => message.sources || []);
  const emailIds = ids.filter(id => id.startsWith('email:')).map(id => id.slice(6));
  const noticeIds = ids.filter(id => id.startsWith('notice:')).map(id => id.slice(7));
  const [emails, notices] = await Promise.all([
    EmailMessage.find({ _id: { $in: emailIds }, ownerId: req.session.user.id }).select('subject receivedAt gmailUrl').lean(),
    Notice.find({ _id: { $in: noticeIds } }).select('title effectiveFrom').lean()
  ]);
  const sourceById = new Map([
    ...emails.map(item => [`email:${item.id}`, { id: `email:${item.id}`, type: 'email', title: item.subject, date: item.receivedAt, url: item.gmailUrl }]),
    ...notices.map(item => [`notice:${item.id}`, { id: `notice:${item.id}`, type: 'notice', title: item.title, date: item.effectiveFrom, url: null }])
  ]);
  res.json({ messages: messages.map(({ _id, sender, text, sources, needsHumanConfirmation, createdAt }) => ({ id: _id, sender, text, sources: (sources || []).map(id => sourceById.get(id)).filter(Boolean), needsHumanConfirmation, createdAt })) });
}));

export default router;
