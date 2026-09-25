import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { db } from './db.js';
import { login, requireAdmin } from './auth.js';
import { UPLOAD_DIR, photoUpload, mediaUpload, fileUrl, isVideo } from './upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

/* ---------- helpers ---------- */

const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const digits = (v) => String(v ?? '').replace(/\D/g, '').slice(-10);

const slugify = (text) =>
  str(text, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'post';

function uniqueSlug(title, ignoreId) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (db.data.posts.some((p) => p.slug === slug && p.id !== ignoreId)) slug = `${base}-${n++}`;
  return slug;
}

// Media URLs may only point at our own uploads/images or an https link (e.g. YouTube).
const safeUrl = (u) => {
  const url = str(u, 1000);
  return /^(\/uploads\/|\/images\/|https:\/\/)/.test(url) ? url : '';
};

const BLOCK_TYPES = ['heading', 'paragraph', 'image', 'video', 'quote'];

function cleanBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b && BLOCK_TYPES.includes(b.type))
    .slice(0, 200)
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return { type: 'heading', level: b.level === 3 ? 3 : 2, text: str(b.text, 200) };
        case 'paragraph':
          return { type: 'paragraph', text: str(b.text, 20000) };
        case 'quote':
          return { type: 'quote', text: str(b.text, 2000), author: str(b.author, 120) };
        default:
          return { type: b.type, url: safeUrl(b.url), caption: str(b.caption, 300) };
      }
    })
    .filter((b) => (b.type === 'image' || b.type === 'video' ? b.url : b.text));
}

function postInput(body = {}, existingId) {
  const title = str(body.title, 200);
  if (!title) throw Object.assign(new Error('Title is required'), { status: 400 });
  return {
    title,
    slug: uniqueSlug(body.slug || title, existingId),
    excerpt: str(body.excerpt, 400),
    category: str(body.category, 60) || 'News',
    coverImage: safeUrl(body.coverImage),
    status: body.status === 'draft' ? 'draft' : 'published',
    blocks: cleanBlocks(body.blocks),
  };
}

const summary = ({ blocks, ...post }) => post;

/* ---------- public: auth ---------- */

app.post('/api/auth/login', login);
app.get('/api/auth/me', requireAdmin, (req, res) => res.json({ username: req.admin.sub }));

/* ---------- public: blog ---------- */

app.get('/api/posts', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const posts = db.data.posts
    .filter((p) => p.status === 'published')
    .filter((p) => !req.query.category || p.category === req.query.category)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(summary);
  res.json(posts);
});

app.get('/api/posts/:slug', (req, res) => {
  const post = db.data.posts.find((p) => p.slug === req.params.slug && p.status === 'published');
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

/* ---------- public: registrations ---------- */

const CATEGORIES = ['Miss India', 'Mrs. India', 'Mr. India'];

app.post('/api/registrations', photoUpload.single('photo'), (req, res) => {
  const b = req.body;
  const fullName = str(b.fullName, 100);
  const phone = digits(b.phone);
  const age = Number(b.age);
  const errors = [];
  if (!fullName) errors.push('Full name is required');
  if (phone.length !== 10) errors.push('Enter a valid 10-digit mobile number');
  if (!CATEGORIES.includes(b.category)) errors.push('Choose a category');
  if (!(age >= 15 && age <= 45)) errors.push('Age must be between 15 and 45 years');
  if (!str(b.city)) errors.push('City is required');
  if (b.agree !== 'true') errors.push('Please accept the terms');
  if (errors.length) {
    if (req.file) fs.rm(req.file.path, () => {});
    return res.status(400).json({ error: errors[0], errors });
  }

  const seq = db.nextId('registration');
  const registration = {
    id: crypto.randomUUID(),
    regId: `MI26-${String(seq).padStart(4, '0')}`,
    category: b.category,
    fullName,
    guardianName: str(b.guardianName, 100),
    gender: str(b.gender, 20),
    dob: str(b.dob, 20),
    age,
    phone,
    whatsapp: digits(b.whatsapp) || phone,
    email: str(b.email, 120),
    city: str(b.city, 80),
    state: str(b.state, 80),
    address: str(b.address, 300),
    height: str(b.height, 20),
    experience: b.experience === 'Professional' ? 'Professional' : 'Fresher',
    occupation: str(b.occupation, 100),
    instagram: str(b.instagram, 100),
    photo: fileUrl(req.file),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.data.registrations.push(registration);
  db.save();
  res.status(201).json({ regId: registration.regId, fullName, category: registration.category });
});

// Public lookup for certificate / ID card: needs both Registration ID and phone.
app.post('/api/registrations/lookup', (req, res) => {
  const regId = str(req.body?.regId, 20).toUpperCase();
  const phone = digits(req.body?.phone);
  const r = db.data.registrations.find((x) => x.regId === regId && x.phone === phone);
  if (!r) return res.status(404).json({ error: 'No registration found for this Registration ID and mobile number' });
  if (r.status === 'rejected') return res.status(403).json({ error: 'This registration is not active. Please contact the organizers.' });
  const { regId: id, fullName, category, city, state, photo, phone: p, status, createdAt } = r;
  res.json({ regId: id, fullName, category, city, state, photo, phone: p, status, createdAt });
});

/* ---------- admin ---------- */

const admin = express.Router();
admin.use(requireAdmin);

admin.get('/stats', (_req, res) => {
  const { posts, registrations, team } = db.data;
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, registrations.filter((r) => r.category === c).length]));
  res.json({
    posts: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
    registrations: registrations.length,
    pending: registrations.filter((r) => r.status === 'pending').length,
    confirmed: registrations.filter((r) => r.status === 'confirmed').length,
    team: team.length,
    byCategory,
    recentRegistrations: [...registrations].reverse().slice(0, 5),
  });
});

// Blog posts
admin.get('/posts', (_req, res) => {
  res.json([...db.data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(summary));
});

admin.get('/posts/:id', (req, res) => {
  const post = db.data.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

admin.post('/posts', (req, res) => {
  const now = new Date().toISOString();
  const post = { id: crypto.randomUUID(), ...postInput(req.body), createdAt: now, updatedAt: now };
  db.data.posts.push(post);
  db.save();
  res.status(201).json(post);
});

admin.put('/posts/:id', (req, res) => {
  const post = db.data.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  Object.assign(post, postInput(req.body, post.id), { updatedAt: new Date().toISOString() });
  db.save();
  res.json(post);
});

admin.delete('/posts/:id', (req, res) => {
  const before = db.data.posts.length;
  db.data.posts = db.data.posts.filter((p) => p.id !== req.params.id);
  if (db.data.posts.length === before) return res.status(404).json({ error: 'Post not found' });
  db.save();
  res.json({ ok: true });
});

admin.post('/upload', mediaUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.status(201).json({ url: fileUrl(req.file), kind: isVideo(req.file) ? 'video' : 'image' });
});

// Registrations
admin.get('/registrations', (_req, res) => res.json([...db.data.registrations].reverse()));

admin.patch('/registrations/:id', (req, res) => {
  const r = db.data.registrations.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Registration not found' });
  if (['pending', 'confirmed', 'rejected'].includes(req.body?.status)) r.status = req.body.status;
  db.save();
  res.json(r);
});

admin.delete('/registrations/:id', (req, res) => {
  db.data.registrations = db.data.registrations.filter((x) => x.id !== req.params.id);
  db.save();
  res.json({ ok: true });
});

// Team members (for team ID cards)
function teamInput(body) {
  const name = str(body.name, 100);
  const designation = str(body.designation, 80);
  if (!name || !designation) throw Object.assign(new Error('Name and designation are required'), { status: 400 });
  return {
    name,
    designation,
    department: str(body.department, 80),
    phone: digits(body.phone),
    bloodGroup: str(body.bloodGroup, 5),
    validTill: str(body.validTill, 20) || '2026-12-31',
  };
}

admin.get('/team', (_req, res) => res.json([...db.data.team].reverse()));

admin.post('/team', photoUpload.single('photo'), (req, res) => {
  const seq = db.nextId('team');
  const member = {
    id: crypto.randomUUID(),
    teamId: `VJSF-T${String(seq).padStart(3, '0')}`,
    ...teamInput(req.body),
    photo: fileUrl(req.file),
    createdAt: new Date().toISOString(),
  };
  db.data.team.push(member);
  db.save();
  res.status(201).json(member);
});

admin.put('/team/:id', photoUpload.single('photo'), (req, res) => {
  const member = db.data.team.find((m) => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  Object.assign(member, teamInput(req.body), req.file ? { photo: fileUrl(req.file) } : {});
  db.save();
  res.json(member);
});

admin.delete('/team/:id', (req, res) => {
  db.data.team = db.data.team.filter((m) => m.id !== req.params.id);
  db.save();
  res.json({ ok: true });
});

app.use('/api/admin', admin);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- serve the built React app in production ---------- */

const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

/* ---------- errors ---------- */

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return res.status(400).json({ error: msg });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message });
});

app.listen(PORT, () => console.log(`✓ Miss India API running on http://localhost:${PORT}`));
