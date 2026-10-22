import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New conversation', maxlength: 120 },
  updatedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });
export default mongoose.model('Conversation', conversationSchema);
