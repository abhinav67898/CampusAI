import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const email = process.env.ROLE_EMAIL?.trim().toLowerCase();
const role = process.env.ROLE_TO_SET;
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI first.');
if (!email || !['student', 'teacher', 'admin'].includes(role)) throw new Error('Set ROLE_EMAIL and ROLE_TO_SET (student, teacher, or admin) in .env.');
await mongoose.connect(process.env.MONGODB_URI);
const user = await User.findOneAndUpdate({ email }, { $set: { role } }, { new: true });
if (!user) {
  await mongoose.disconnect();
  throw new Error(`No account found for ${email}. Have the user sign in once before assigning a role.`);
}
console.log(`Updated ${user.email} to role ${user.role}.`);
await mongoose.disconnect();
