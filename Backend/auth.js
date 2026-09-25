import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEFAULT_PASSWORD = 'admin@2026';
const secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const adminUser = process.env.ADMIN_USERNAME || 'admin';
const adminPass = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

if (!process.env.ADMIN_PASSWORD) {
  console.warn(`⚠  ADMIN_PASSWORD not set — using default "${DEFAULT_PASSWORD}". Set it in Backend/.env before going live.`);
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠  JWT_SECRET not set — admin logins will reset whenever the server restarts.');
}

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function login(req, res) {
  const { username = '', password = '' } = req.body || {};
  const ok = safeEqual(username, adminUser) & safeEqual(password, adminPass);
  if (!ok) return res.status(401).json({ error: 'Invalid username or password' });
  const token = jwt.sign({ sub: adminUser, role: 'admin' }, secret, { expiresIn: '12h' });
  res.json({ token, username: adminUser });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    req.admin = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in again' });
  }
}
