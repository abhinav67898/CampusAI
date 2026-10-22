const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
const tokenUrl = 'https://oauth2.googleapis.com/token';

function oauthConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) throw Object.assign(new Error('Google OAuth is not configured.'), { status: 503 });
  return { client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT_URI };
}

export function createGoogleAuthUrl(state) {
  const q = new URLSearchParams({ ...oauthConfig(), response_type: 'code', scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state });
  return `${authUrl}?${q}`;
}

export async function exchangeCode(code) {
  const response = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...oauthConfig(), code, grant_type: 'authorization_code' }) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error('Google sign-in could not be completed.'), { status: 502 });
  return data;
}

export async function googleProfile(accessToken) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw Object.assign(new Error('Could not verify the Google account.'), { status: 502 });
  return response.json();
}

export async function gmailRequest(path, token) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error('Gmail could not be read. Reconnect the Google account and try again.'), { status: response.status === 401 ? 401 : 502 });
  return data;
}

export async function freshAccessToken(refreshToken) {
  const response = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...oauthConfig(), refresh_token: refreshToken, grant_type: 'refresh_token' }) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error('Google authorization expired. Reconnect your account.'), { status: 401 });
  return data.access_token;
}

export async function revokeGoogleToken(refreshToken) {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams() });
  if (!response.ok) throw Object.assign(new Error('Google could not revoke the stored permission. Try again.'), { status: 502 });
}
