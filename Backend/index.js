import './env.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initDb, query, one } from './db.js';
import { login, requireAdmin } from './auth.js';
import {
  UPLOAD_DIR, PRIVATE_DIR, registrationUpload, photoUpload, mediaUpload,
  publicUrl, isVideo, discardFiles, removeStored,
} from './upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 6869;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

/* ---------- helpers ---------- */

const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const digits = (v) => String(v ?? '').replace(/\D/g, '').slice(-10);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const oneOf = (v, list) => (list.includes(v) ? v : '');
const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });
const iso = (d) => (d ? new Date(d).toISOString() : null);

const CATEGORIES = ['Miss India', 'Mrs. India', 'Mr. India'];
const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['pending', 'confirmed', 'rejected'];
const AWARDS = ['Participation', 'Winner', '1st Runner-Up', '2nd Runner-Up', 'Special Award'];

// Kept in sync with Frontend/src/data/event.js (ENQUIRY_TOPICS / ENQUIRY_INTERESTS).
const ENQUIRY_TOPICS = [
  'Registration process & fee', 'Eligibility & age criteria', 'Audition & grooming dates',
  'Venue, stay & travel', 'Winner prizes & benefits', 'Sponsorship / partnership',
  'Creator / media collaboration', 'Please call me back',
];
const ENQUIRY_INTERESTS = ['Miss India', 'Mrs. India', 'Mr. India', 'Just exploring'];

/* ---------- row mappers (snake_case DB → camelCase API) ---------- */

const toRegistration = (r) => ({
  id: r.id,
  regId: r.reg_id,
  category: r.category,
  fullName: r.full_name,
  dob: r.dob || '',
  age: r.age ?? '',
  gender: r.gender,
  phone: r.phone,
  whatsapp: r.whatsapp,
  email: r.email,
  city: r.city,
  state: r.state,
  address: r.address,
  height: r.height,
  occupation: r.occupation,
  instagram: r.instagram,
  facebook: r.facebook,
  experience: r.experience,
  experienceDetails: r.experience_details || '',
  photo: r.photo,
  photoFull: r.photo_full,
  idProof: r.id_proof,
  whyParticipate: r.why_participate || '',
  strengths: r.strengths || '',
  mediaExperience: r.media_experience,
  comfortableGrooming: r.comfortable_grooming,
  feeAcknowledged: Boolean(r.fee_acknowledged),
  paymentRef: r.payment_ref,
  paymentProof: r.payment_proof,
  guardianName: r.guardian_name,
  guardianRelation: r.guardian_relation,
  guardianPhone: r.guardian_phone,
  guardianConsent: Boolean(r.guardian_consent),
  status: r.status,
  award: r.award,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

// What an ID card needs. "Fully filled" = none of these are empty.
const CARD_FIELDS = [
  ['fullName', 'Full name'], ['phone', 'Mobile number'], ['email', 'Email'], ['address', 'Address'],
  ['category', 'Category'], ['gender', 'Gender'], ['dob', 'Date of birth'],
  ['city', 'City'], ['state', 'State'], ['photo', 'Close-up photograph'],
];
const missingForCard = (reg) => CARD_FIELDS.filter(([k]) => !reg[k]).map(([k, label]) => ({ key: k, label }));

// What the public (the contestant themself) gets back from a lookup.
const publicView = (reg) => ({
  regId: reg.regId,
  fullName: reg.fullName,
  category: reg.category,
  gender: reg.gender,
  dob: reg.dob,
  age: reg.age,
  city: reg.city,
  state: reg.state,
  phone: reg.phone,
  email: reg.email,
  photo: reg.photo,
  status: reg.status,
  award: reg.award,
  createdAt: reg.createdAt,
  missing: missingForCard(reg),
});

const toTeam = (m) => ({
  id: m.id,
  teamId: m.team_id,
  name: m.name,
  designation: m.designation,
  department: m.department,
  phone: m.phone,
  bloodGroup: m.blood_group,
  validTill: m.valid_till || '',
  photo: m.photo,
  createdAt: iso(m.created_at),
});

const toEnquiry = (e) => ({ ...e, createdAt: iso(e.created_at), created_at: undefined });

const toPost = (p, withBlocks = true) => ({
  id: p.id,
  slug: p.slug,
  type: p.type,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  coverImage: p.cover_image,
  status: p.status,
  ...(withBlocks ? { blocks: typeof p.blocks === 'string' ? JSON.parse(p.blocks) : p.blocks } : {}),
  createdAt: iso(p.created_at),
  updatedAt: iso(p.updated_at),
});

/* ---------- blog helpers ---------- */

const slugify = (text) =>
  str(text, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post';

async function uniqueSlug(title, ignoreId = '') {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (await one('SELECT id FROM posts WHERE slug = ? AND id <> ?', [slug, ignoreId])) slug = `${base}-${n++}`;
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

async function postInput(body = {}, existingId) {
  const title = str(body.title, 200);
  if (!title) throw badRequest('Title is required');
  return {
    title,
    slug: await uniqueSlug(body.slug || title, existingId),
    type: body.type === 'news' ? 'news' : 'blog',
    excerpt: str(body.excerpt, 400),
    category: str(body.category, 60) || 'News',
    cover_image: safeUrl(body.coverImage),
    status: body.status === 'draft' ? 'draft' : 'published',
    blocks: JSON.stringify(cleanBlocks(body.blocks)),
  };
}

/* ---------- public: auth ---------- */

// Health check — also lets setup.js recognise an old copy of this backend still holding the port.
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'miss-india-backend', pid: process.pid }));

app.post('/api/auth/login', login);
app.get('/api/auth/me', requireAdmin, (req, res) => res.json({ username: req.admin.sub }));

/* ---------- public: blog ---------- */

app.get('/api/posts', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const params = [];
  let where = "status = 'published'";
  if (req.query.category) { where += ' AND category = ?'; params.push(str(req.query.category, 60)); }
  if (['blog', 'news'].includes(req.query.type)) { where += ' AND type = ?'; params.push(req.query.type); }
  const rows = await query(`SELECT * FROM posts WHERE ${where} ORDER BY created_at DESC LIMIT ?`, [...params, limit]);
  res.json(rows.map((p) => toPost(p, false)));
});

app.get('/api/posts/:slug', async (req, res) => {
  const post = await one("SELECT * FROM posts WHERE slug = ? AND status = 'published'", [req.params.slug]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(toPost(post));
});

/* ---------- public: registrations ---------- */

function registrationInput(b) {
  const age = Number(b.age);
  return {
    category: oneOf(b.category, CATEGORIES),
    full_name: str(b.fullName, 100),
    dob: /^\d{4}-\d{2}-\d{2}$/.test(b.dob) ? b.dob : null,
    age: Number.isInteger(age) && age > 0 ? age : null,
    gender: oneOf(b.gender, GENDERS),
    phone: digits(b.phone),
    whatsapp: digits(b.whatsapp),
    email: str(b.email, 120).toLowerCase(),
    city: str(b.city, 80),
    state: str(b.state, 80),
    address: str(b.address, 400),
    height: str(b.height, 20),
    occupation: str(b.occupation, 100),
    instagram: str(b.instagram, 100),
    facebook: str(b.facebook, 200),
    experience: oneOf(b.experience, ['Fresher', 'Experienced']),
    experience_details: str(b.experienceDetails, 2000),
    why_participate: str(b.whyParticipate, 2000),
    strengths: str(b.strengths, 2000),
    media_experience: oneOf(b.mediaExperience, ['Yes', 'No']),
    comfortable_grooming: oneOf(b.comfortableGrooming, ['Yes', 'No']),
    fee_acknowledged: b.feeAcknowledged === 'true' ? 1 : 0,
    payment_ref: str(b.paymentRef, 100),
    guardian_name: str(b.guardianName, 100),
    guardian_relation: str(b.guardianRelation, 40),
    guardian_phone: digits(b.guardianPhone),
    guardian_consent: b.guardianConsent === 'true' ? 1 : 0,
  };
}

app.post('/api/registrations', registrationUpload, async (req, res) => {
  const reg = registrationInput(req.body);
  const errors = [];
  // Only these four are mandatory — everything else is optional.
  if (!reg.full_name) errors.push('Full name is required');
  if (reg.phone.length !== 10) errors.push('Enter a valid 10-digit mobile number');
  if (!isEmail(reg.email)) errors.push('Enter a valid email address');
  if (reg.address.length < 5) errors.push('Full address is required');
  if (reg.age !== null && (reg.age < 15 || reg.age > 45)) errors.push('Age must be between 15 and 45 years');
  if (req.body.agree !== 'true') errors.push('Please accept the declaration and terms');

  if (!errors.length) {
    const dup = await one('SELECT id FROM registrations WHERE phone = ? AND category = ? AND status <> ?', [reg.phone, reg.category, 'rejected']);
    if (dup) errors.push(`This mobile number is already registered${reg.category ? ` for ${reg.category}` : ''}. Use "Find my registration" on the ID Card page.`);
  }
  if (errors.length) {
    discardFiles(req);
    return res.status(400).json({ error: errors[0], errors });
  }

  const f = req.files || {};
  reg.photo = publicUrl(f.photo?.[0]);
  reg.photo_full = f.photoFull?.[0]?.filename || '';
  reg.id_proof = f.idProof?.[0]?.filename || '';
  reg.payment_proof = f.paymentProof?.[0]?.filename || '';

  const result = await query('INSERT INTO registrations SET ?', [reg]);
  const regId = `MI26-${String(result.insertId).padStart(4, '0')}`;
  await query('UPDATE registrations SET reg_id = ? WHERE id = ?', [regId, result.insertId]);

  const saved = toRegistration(await one('SELECT * FROM registrations WHERE id = ?', [result.insertId]));
  res.status(201).json(publicView(saved));
});

// Finds a registration for the contestant: Registration ID or email, plus the mobile number.
async function findOwn(body = {}) {
  const phone = digits(body.phone);
  const regId = str(body.regId, 20).toUpperCase();
  const email = str(body.email, 120).toLowerCase();
  if (phone.length !== 10 || (!regId && !email)) throw badRequest('Enter your mobile number with your Registration ID or email');
  const row = regId
    ? await one('SELECT * FROM registrations WHERE reg_id = ? AND phone = ?', [regId, phone])
    : await one('SELECT * FROM registrations WHERE email = ? AND phone = ? ORDER BY id DESC', [email, phone]);
  if (!row) throw Object.assign(new Error('No registration found for these details. Please check and try again.'), { status: 404 });
  const reg = toRegistration(row);
  if (reg.status === 'rejected') throw Object.assign(new Error('This registration is not active. Please contact the organizers.'), { status: 403 });
  return reg;
}

app.post('/api/registrations/lookup', async (req, res) => {
  res.json(publicView(await findOwn(req.body)));
});

// Lets a contestant fill in the details their ID card still needs. Only empty fields are filled.
app.post('/api/registrations/complete', photoUpload.single('photo'), async (req, res) => {
  let reg;
  try {
    reg = await findOwn(req.body);
  } catch (err) {
    discardFiles(req);
    throw err;
  }
  const input = registrationInput({ ...req.body, fullName: '', phone: '', email: '', address: '' });
  const updates = {};
  // These keys are named the same in the DB row and the API object.
  for (const key of ['category', 'gender', 'dob', 'age', 'city', 'state']) {
    if (!reg[key] && input[key]) updates[key] = input[key];
  }
  if (!reg.address && str(req.body.address, 400).length >= 5) updates.address = str(req.body.address, 400);
  if (updates.age && (updates.age < 15 || updates.age > 45)) {
    discardFiles(req);
    throw badRequest('Age must be between 15 and 45 years');
  }
  if (req.file) {
    if (reg.photo) removeStored(reg.photo);
    updates.photo = publicUrl(req.file);
  }
  if (Object.keys(updates).length) await query('UPDATE registrations SET ? WHERE id = ?', [updates, reg.id]);
  const saved = toRegistration(await one('SELECT * FROM registrations WHERE id = ?', [reg.id]));
  res.json(publicView(saved));
});

/* ---------- public: enquiries (select-only lead form) ---------- */

app.post('/api/enquiries', async (req, res) => {
  const b = req.body || {};
  const enquiry = {
    name: str(b.name, 100),
    phone: digits(b.phone),
    city: str(b.city, 80),
    topic: oneOf(b.topic, ENQUIRY_TOPICS),
    interest: oneOf(b.interest, ENQUIRY_INTERESTS),
    source: str(b.source, 40) || 'website',
  };
  if (!enquiry.name) throw badRequest('Please enter your name');
  if (enquiry.phone.length !== 10) throw badRequest('Enter a valid 10-digit mobile number');
  if (!enquiry.topic) throw badRequest('Please choose what you would like to know');
  const result = await query('INSERT INTO enquiries SET ?', [enquiry]);
  res.status(201).json({ id: result.insertId, ok: true });
});

/* ---------- admin ---------- */

const admin = express.Router();
admin.use(requireAdmin);

admin.get('/stats', async (_req, res) => {
  const [posts] = await query(
    "SELECT COUNT(*) AS total, SUM(status = 'published') AS published, SUM(status = 'draft') AS drafts FROM posts",
  );
  const [regs] = await query(
    "SELECT COUNT(*) AS total, SUM(status = 'pending') AS pending, SUM(status = 'confirmed') AS confirmed FROM registrations",
  );
  const [enq] = await query("SELECT COUNT(*) AS total, SUM(status = 'new') AS fresh FROM enquiries");
  const [team] = await query('SELECT COUNT(*) AS total FROM team');
  const cats = await query('SELECT category, COUNT(*) AS n FROM registrations GROUP BY category');
  const recent = await query('SELECT * FROM registrations ORDER BY id DESC LIMIT 5');
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, Number(cats.find((x) => x.category === c)?.n || 0)]));
  res.json({
    posts: Number(posts.total), published: Number(posts.published || 0), drafts: Number(posts.drafts || 0),
    registrations: Number(regs.total), pending: Number(regs.pending || 0), confirmed: Number(regs.confirmed || 0),
    enquiries: Number(enq.total), newEnquiries: Number(enq.fresh || 0),
    team: Number(team.total),
    byCategory,
    recentRegistrations: recent.map(toRegistration),
  });
});

// Blog posts
admin.get('/posts', async (_req, res) => {
  const rows = await query('SELECT * FROM posts ORDER BY created_at DESC');
  res.json(rows.map((p) => toPost(p, false)));
});

admin.get('/posts/:id', async (req, res) => {
  const post = await one('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(toPost(post));
});

admin.post('/posts', async (req, res) => {
  const id = crypto.randomUUID();
  await query('INSERT INTO posts SET ?', [{ id, ...(await postInput(req.body)) }]);
  res.status(201).json(toPost(await one('SELECT * FROM posts WHERE id = ?', [id])));
});

admin.put('/posts/:id', async (req, res) => {
  const existing = await one('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  await query('UPDATE posts SET ? WHERE id = ?', [await postInput(req.body, existing.id), existing.id]);
  res.json(toPost(await one('SELECT * FROM posts WHERE id = ?', [existing.id])));
});

admin.delete('/posts/:id', async (req, res) => {
  const result = await query('DELETE FROM posts WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Post not found' });
  res.json({ ok: true });
});

admin.post('/upload', mediaUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.status(201).json({ url: publicUrl(req.file), kind: isVideo(req.file) ? 'video' : 'image' });
});

// Registrations
function registrationFilter(q) {
  const where = [];
  const params = [];
  if (STATUSES.includes(q.status)) { where.push('status = ?'); params.push(q.status); }
  if (CATEGORIES.includes(q.category)) { where.push('category = ?'); params.push(q.category); }
  const search = str(q.q, 100);
  if (search) {
    where.push('(full_name LIKE ? OR reg_id LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)');
    params.push(...Array(5).fill(`%${search}%`));
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

admin.get('/registrations', async (req, res) => {
  const { sql, params } = registrationFilter(req.query);
  const rows = await query(`SELECT * FROM registrations ${sql} ORDER BY id DESC`, params);
  res.json(rows.map((r) => ({ ...toRegistration(r), missing: missingForCard(toRegistration(r)) })));
});

const CSV_COLUMNS = [
  ['regId', 'Registration ID'], ['category', 'Category'], ['fullName', 'Full Name'], ['phone', 'Mobile'],
  ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['dob', 'Date of Birth'], ['age', 'Age'], ['gender', 'Gender'],
  ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['height', 'Height'], ['occupation', 'Occupation'],
  ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['experience', 'Experience'],
  ['experienceDetails', 'Experience Details'], ['whyParticipate', 'Why Participate'], ['strengths', 'Strengths'],
  ['mediaExperience', 'Media Experience'], ['comfortableGrooming', 'Comfortable with Grooming'],
  ['paymentRef', 'Payment Reference'], ['guardianName', 'Guardian Name'], ['guardianRelation', 'Guardian Relation'],
  ['guardianPhone', 'Guardian Mobile'], ['status', 'Status'], ['award', 'Award'], ['createdAt', 'Registered At'],
];

admin.get('/registrations.csv', async (req, res) => {
  const { sql, params } = registrationFilter(req.query);
  const rows = (await query(`SELECT * FROM registrations ${sql} ORDER BY id`, params)).map(toRegistration);
  // Prefix formula-looking cells so spreadsheets never execute them.
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [CSV_COLUMNS.map(([, h]) => cell(h)).join(','), ...rows.map((r) => CSV_COLUMNS.map(([k]) => cell(r[k])).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
  res.send(`﻿${csv}`);
});

admin.get('/registrations/:id', async (req, res) => {
  const row = await one('SELECT * FROM registrations WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Registration not found' });
  const reg = toRegistration(row);
  res.json({ ...reg, missing: missingForCard(reg) });
});

admin.patch('/registrations/:id', async (req, res) => {
  const updates = {};
  if (STATUSES.includes(req.body?.status)) updates.status = req.body.status;
  if (AWARDS.includes(req.body?.award)) updates.award = req.body.award;
  if (!Object.keys(updates).length) throw badRequest('Nothing to update');
  const result = await query('UPDATE registrations SET ? WHERE id = ?', [updates, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Registration not found' });
  const reg = toRegistration(await one('SELECT * FROM registrations WHERE id = ?', [req.params.id]));
  res.json({ ...reg, missing: missingForCard(reg) });
});

admin.delete('/registrations/:id', async (req, res) => {
  const row = await one('SELECT photo, photo_full, id_proof, payment_proof FROM registrations WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Registration not found' });
  await query('DELETE FROM registrations WHERE id = ?', [req.params.id]);
  Object.values(row).forEach(removeStored);
  res.json({ ok: true });
});

// Private documents (ID proof, payment proof, full-length photo) — admins only.
admin.get('/files/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(PRIVATE_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(file);
});

// Enquiries
admin.get('/enquiries', async (req, res) => {
  const status = ['new', 'contacted'].includes(req.query.status) ? req.query.status : '';
  const rows = await query(`SELECT * FROM enquiries ${status ? 'WHERE status = ?' : ''} ORDER BY id DESC`, status ? [status] : []);
  res.json(rows.map(toEnquiry));
});

admin.patch('/enquiries/:id', async (req, res) => {
  if (!['new', 'contacted'].includes(req.body?.status)) throw badRequest('Invalid status');
  await query('UPDATE enquiries SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json(toEnquiry(await one('SELECT * FROM enquiries WHERE id = ?', [req.params.id])));
});

admin.delete('/enquiries/:id', async (req, res) => {
  await query('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// Team members (for team ID cards)
function teamInput(body) {
  const name = str(body.name, 100);
  const designation = str(body.designation, 80);
  if (!name || !designation) throw badRequest('Name and designation are required');
  return {
    name,
    designation,
    department: str(body.department, 80),
    phone: digits(body.phone),
    blood_group: str(body.bloodGroup, 5),
    valid_till: /^\d{4}-\d{2}-\d{2}$/.test(body.validTill) ? body.validTill : '2026-12-31',
  };
}

admin.get('/team', async (_req, res) => {
  res.json((await query('SELECT * FROM team ORDER BY id DESC')).map(toTeam));
});

admin.post('/team', photoUpload.single('photo'), async (req, res) => {
  let input;
  try { input = teamInput(req.body); } catch (err) { discardFiles(req); throw err; }
  const result = await query('INSERT INTO team SET ?', [{ ...input, photo: publicUrl(req.file) }]);
  await query('UPDATE team SET team_id = ? WHERE id = ?', [`VJSF-T${String(result.insertId).padStart(3, '0')}`, result.insertId]);
  res.status(201).json(toTeam(await one('SELECT * FROM team WHERE id = ?', [result.insertId])));
});

admin.put('/team/:id', photoUpload.single('photo'), async (req, res) => {
  const member = await one('SELECT * FROM team WHERE id = ?', [req.params.id]);
  if (!member) { discardFiles(req); return res.status(404).json({ error: 'Member not found' }); }
  let input;
  try { input = teamInput(req.body); } catch (err) { discardFiles(req); throw err; }
  if (req.file) { removeStored(member.photo); input.photo = publicUrl(req.file); }
  await query('UPDATE team SET ? WHERE id = ?', [input, member.id]);
  res.json(toTeam(await one('SELECT * FROM team WHERE id = ?', [member.id])));
});

admin.delete('/team/:id', async (req, res) => {
  const member = await one('SELECT photo FROM team WHERE id = ?', [req.params.id]);
  await query('DELETE FROM team WHERE id = ?', [req.params.id]);
  if (member) removeStored(member.photo);
  res.json({ ok: true });
});

app.use('/api/admin', admin);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- serve the built React app in production ---------- */

const FRONTEND_DIST = path.join(__dirname, '..', 'Frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
}

/* ---------- errors ---------- */

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message;
    return res.status(400).json({ error: msg });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message });
});

/* ---------- start ---------- */

const paint = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = paint('32');
const gold = paint('33');
const pink = paint('35');
const dim = paint('2');
const bold = paint('1');

// Draws a box; widths ignore colour codes so the right border lines up.
function box(lines) {
  const visible = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').length;
  const width = Math.max(...lines.map(visible)) + 2;
  const out = [pink(`╔${'═'.repeat(width)}╗`)];
  for (const l of lines) out.push(`${pink('║')} ${l}${' '.repeat(width - 1 - visible(l))}${pink('║')}`);
  out.push(pink(`╚${'═'.repeat(width)}╝`));
  return out.join('\n');
}

console.log(dim('\n⏳ Connecting to MySQL…'));
initDb()
  .then((db) => {
    // Plain http server: Express 5 also calls the listen callback on errors, so print only on "listening".
    const server = http.createServer(app);
    server.listen(PORT);
    server.on('listening', () => {
      const rows = Object.entries(db.counts).map(([t, n]) => `${t} ${bold(String(n))}`).join(dim('  ·  '));
      console.log(`\n${box([
        gold(bold('👑  MR. MISS. & MRS. INDIA 2026 — BACKEND')),
        '',
        `${green('✔')}  ${bold('Database connected successfully')}`,
        `    ${dim('MySQL')}     ${db.version}  ${dim(`(${db.user}@${db.host})`)}`,
        `    ${dim('Database')}  ${db.name}`,
        `    ${dim('Tables')}    ${rows}`,
        '',
        `${green('✔')}  ${bold('Server started successfully')}`,
        `    ${dim('API')}       http://localhost:${PORT}/api`,
        `    ${dim('Website')}   http://localhost:5173   ${dim('(Frontend: npm run dev)')}`,
        `    ${dim('Admin')}     http://localhost:5173/admin`,
        '',
        dim('Press Ctrl + C to stop'),
      ])}\n`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n✗ Port ${PORT} is already in use.`);
        console.error('  Stop with Ctrl + C and run  npm run dev  again — it frees the port from an old backend automatically.\n');
      } else {
        console.error('\n✗ Server failed to start:', err.message, '\n');
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('\n✗ Could not connect to MySQL:', err.message);
    console.error('  Check DB_HOST / DB_USER / DB_PASSWORD in Backend/.env and that the MySQL service is running.');
    console.error('  Run  npm run setup  to enter the MySQL password again.\n');
    process.exit(1);
  });
