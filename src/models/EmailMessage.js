import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  gmailId: { type: String, required: true },
  threadId: String,
  from: { type: String, maxlength: 320 },
  subject: { type: String, maxlength: 500 },
  receivedAt: Date,
  snippet: { type: String, maxlength: 1000 },
  text: { type: String, maxlength: 40000 },
  labels: [String],
  category: { type: String, enum: ['schedule', 'event', 'club', 'exam', 'deadline', 'other'], default: 'other' },
  audience: { type: String, default: 'all' },
  isRelevant: { type: Boolean, default: true },
  gmailUrl: String
}, { timestamps: true });
emailSchema.index({ ownerId: 1, gmailId: 1 }, { unique: true });
emailSchema.index({ ownerId: 1, receivedAt: -1 });
emailSchema.index({ subject: 'text', text: 'text', from: 'text' });
export default mongoose.model('EmailMessage', emailSchema);
