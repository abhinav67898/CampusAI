import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { connectDatabase } from './src/config/database.js';
import authRoutes from './src/routes/auth.js';
import googleRoutes from './src/routes/google.js';
import emailRoutes from './src/routes/emails.js';
import assistantRoutes from './src/routes/assistant.js';
import noticeRoutes from './src/routes/notices.js';
import conversationRoutes from './src/routes/conversations.js';
import { errorHandler } from './src/middleware/errors.js';

const required = ['MONGODB_URI', 'SESSION_SECRET'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
if (process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');

await connectDatabase();
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && origin !== appOrigin) return res.status(403).json({ error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This origin is not allowed.' } });
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(session({
  name: 'campusai.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions', touchAfter: 24 * 3600 }),
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }), authRoutes);
app.use('/api/google', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), googleRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/assistant', rateLimit({ windowMs: 5 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), assistantRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/conversations', conversationRoutes);
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`CampusAI API listening on port ${port}`));
