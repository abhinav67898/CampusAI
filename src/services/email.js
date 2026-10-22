import { gmailRequest, freshAccessToken } from './google.js';
import { decryptSecret } from './crypto.js';

function decodePart(data = '') {
  try { return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch { return ''; }
}

function collectText(part, output) {
  if (part.mimeType === 'text/plain' && part.body?.data) output.push(decodePart(part.body.data));
  for (const child of part.parts || []) collectText(child, output);
}

export function extractEmailText(payload) {
  const parts = [];
  collectText(payload || {}, parts);
  if (!parts.length && payload?.body?.data) parts.push(decodePart(payload.body.data));
  return parts.join('\n').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 40000);
}

export function classifyEmail(subject = '', text = '') {
  const input = `${subject} ${text.slice(0, 1500)}`.toLowerCase();
  if (/exam|test|mid.?term|result/.test(input)) return 'exam';
  if (/club|recruit|audition|society/.test(input)) return 'club';
  if (/deadline|submit|registration|last date/.test(input)) return 'deadline';
  if (/schedule|timetable|class|lecture|room|venue/.test(input)) return 'schedule';
  if (/event|fest|workshop|seminar|webinar/.test(input)) return 'event';
  return 'other';
}

export async function syncMailbox(user, requestedLimit = 20) {
  if (!user.gmailRefreshToken) throw Object.assign(new Error('Connect a Gmail account before syncing.'), { status: 409 });
  const refreshToken = decryptSecret(user.gmailRefreshToken);
  const accessToken = await freshAccessToken(refreshToken);
  const maxResults = Math.max(1, Math.min(Number(requestedLimit) || 20, 50));
  const list = await gmailRequest(`messages?maxResults=${maxResults}&q=${encodeURIComponent('newer_than:90d -category:promotions -category:social')}`, accessToken);
  const messages = list.messages || [];
  const results = [];
  for (const item of messages) {
    try {
      const full = await gmailRequest(`messages/${encodeURIComponent(item.id)}?format=full`, accessToken);
      const headers = full.payload?.headers || [];
      const header = name => headers.find(h => h.name?.toLowerCase() === name)?.value || '';
      const text = extractEmailText(full.payload);
      const subject = header('subject').slice(0, 500);
      results.push({ gmailId: full.id, threadId: full.threadId, from: header('from').slice(0, 320), subject, receivedAt: new Date(Number(full.internalDate) || Date.now()), snippet: String(full.snippet || '').slice(0, 1000), text, labels: full.labelIds || [], category: classifyEmail(subject, text), audience: 'private', isRelevant: true, gmailUrl: `https://mail.google.com/mail/u/0/#all/${full.id}` });
    } catch (error) { console.error(`Skipping Gmail message ${item.id}:`, error.message); }
  }
  return { messages: results, scanned: messages.length };
}
