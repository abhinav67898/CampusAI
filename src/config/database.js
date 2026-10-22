import mongoose from 'mongoose';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB.');
}
