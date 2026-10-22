import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student', index: true },
  audienceGroup: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  passwordHash: { type: String, select: false },
  googleSub: { type: String, sparse: true, unique: true },
  gmailRefreshToken: { type: String, select: false },
  gmailConnectedAt: Date
}, { timestamps: true });

export default mongoose.model('User', userSchema);
