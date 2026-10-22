import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, trim: true, maxlength: 20000 },
  category: { type: String, enum: ['schedule', 'event', 'club', 'exam', 'deadline', 'other'], default: 'other' },
  audience: { type: String, default: 'all', trim: true },
  effectiveFrom: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['published', 'archived'], default: 'published' }
}, { timestamps: true });
noticeSchema.index({ status: 1, effectiveFrom: 1, expiresAt: 1, audience: 1 });
noticeSchema.index({ title: 'text', body: 'text' });
export default mongoose.model('Notice', noticeSchema);
