import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const pairs = [
  { email: process.env.SEED_TEACHER_EMAIL, password: process.env.SEED_TEACHER_PASSWORD, name: 'Demo Teacher', role: 'teacher' },
  { email: process.env.SEED_STUDENT_EMAIL, password: process.env.SEED_STUDENT_PASSWORD, name: 'Demo Student', role: 'student' }
];
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI first.');
if (pairs.some(pair => !pair.email || !pair.password || pair.password.length < 4)) throw new Error('Set both seed emails and passwords (at least 4 characters) in .env.');
await mongoose.connect(process.env.MONGODB_URI);
for (const pair of pairs) {
  const passwordHash = await bcrypt.hash(pair.password, 12);
  await User.updateOne({ email: pair.email.toLowerCase() }, { $set: { name: pair.name, role: pair.role, passwordHash, isActive: true } }, { upsert: true });
  console.log(`Seeded ${pair.role}: ${pair.email}`);
}
await mongoose.disconnect();
