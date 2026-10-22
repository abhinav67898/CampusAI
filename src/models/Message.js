import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: String, enum: ['student', 'assistant'], required: true },
  text: { type: String, required: true, maxlength: 6000 },
  sources: [{ type: String }],
  needsHumanConfirmation: { type: Boolean, default: false }
}, { timestamps: true });
messageSchema.index({ conversationId: 1, createdAt: 1 });
export default mongoose.model('Message', messageSchema);
