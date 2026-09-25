// High-resolution canvas generators for the certificate and ID cards.
//   Certificate: A4 landscape @ 300 dpi  → 3508 × 2480 px
//   ID card:     CR80 portrait (54 × 85.6 mm) → 1080 × 1712 px (~508 dpi)
// Everything is drawn with vectors + web fonts, so the output stays sharp in print.
import { EVENT } from '../data/event.js';

export const CERT_W = 3508;
export const CERT_H = 2480;
export const CARD_W = 1080;
export const CARD_H = 1712;

const C = {
  plum950: '#12051a', plum900: '#1a0820', plum800: '#26102f', plum700: '#3a1845',
  wine: '#7a1340', wine600: '#9b1b52', rose: '#e0457b',
  gold: '#d6a24c', gold200: '#f7e2a1', gold300: '#f4d98b', gold600: '#a8762a', gold800: '#7d5518',
  ivory: '#fff8ef', ivory200: '#f6eadb', ink: '#241329', muted: '#7d6b80',
};

// Each category gets its own accent so staff can tell cards apart at a glance.
export const CATEGORY_THEME = {
  'Miss India': { from: '#e0457b', to: '#9b1b52', label: 'MISS INDIA' },
  'Mrs. India': { from: '#8a3ec9', to: '#4c1780', label: 'MRS. INDIA' },
  'Mr. India': { from: '#2f5fc4', to: '#15306b', label: 'MR. INDIA' },
  team: { from: '#12917f', to: '#0a5249', label: 'ORGANIZING TEAM' },
  none: { from: '#c08a36', to: '#7d5518', label: 'CONTESTANT' },
};

const F = {
  display: (w, s) => `${w} ${s}px Cinzel, "Times New Roman", serif`,
  serif: (w, s, italic = false) => `${italic ? 'italic ' : ''}${w} ${s}px "Playfair Display", Georgia, serif`,
  script: (s) => `400 ${s}px "Great Vibes", cursive`,
  body: (w, s) => `${w} ${s}px Poppins, "Segoe UI", Arial, sans-serif`,
};

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

let fontsReady;
/** Makes sure the web fonts are downloaded before we paint text onto a canvas. */
export function loadFonts() {
  if (!fontsReady) {
    const faces = [
      F.display(700, 60), F.display(800, 60), F.script(60), F.serif(700, 60), F.serif(500, 60, true),
      F.body(400, 40), F.body(500, 40), F.body(600, 40),
    ];
    fontsReady = Promise.all(faces.map((f) => document.fonts?.load(f).catch(() => null)))
      .then(() => document.fonts?.ready);
  }
  return fontsReady;
}

/** Loads an image; resolves null (never rejects) so a missing photo never breaks a card. */
export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ------------------------------------------------------------------ */
/* Drawing helpers                                                     */
/* ------------------------------------------------------------------ */

const TAU = Math.PI * 2;

function goldLinear(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, C.gold200);
  g.addColorStop(0.45, C.gold);
  g.addColorStop(0.75, C.gold600);
  g.addColorStop(1, C.gold300);
  return g;
}

function linear(ctx, x0, y0, x1, y1, from, to) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Arch = rounded top (like the website's hero frame) with softly rounded bottom corners.
function archPath(ctx, x, y, w, h, r = 28) {
  const rad = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + rad);
  ctx.arc(x + rad, y + rad, rad, Math.PI, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h, focusY = 0.3) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, (img.naturalHeight - sh) * focusY));
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Text with manual letter-spacing (canvas letterSpacing isn't available everywhere). */
function spacedText(ctx, text, x, y, spacing, align = 'center') {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
  return total;
}

function spacedWidth(ctx, text, spacing) {
  return [...text].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacing * ([...text].length - 1);
}

/** Shrinks the font until the text fits maxWidth. Returns the chosen size. */
function fitFont(ctx, text, maxWidth, makeFont, size, min = 10, spacing = 0) {
  let s = size;
  ctx.font = makeFont(s);
  while (s > min && (spacing ? spacedWidth(ctx, text, spacing * (s / size)) : ctx.measureText(text).width) > maxWidth) {
    s -= 2;
    ctx.font = makeFont(s);
  }
  return s;
}

/**
 * Centered paragraph with mixed regular/bold runs, wrapped to maxWidth.
 * segments: [{ text, bold }]. Returns the y below the last line.
 */
function richParagraph(ctx, segments, cx, y, maxWidth, lineHeight, style) {
  const tokens = [];
  segments.forEach((seg) => seg.text.split(/(\s+)/).forEach((t) => t && tokens.push({ t, bold: !!seg.bold })));
  const fontFor = (bold) => (bold ? style.bold : style.regular);

  const lines = [[]];
  const widths = [0];
  for (const tok of tokens) {
    ctx.font = fontFor(tok.bold);
    const w = ctx.measureText(tok.t).width;
    const space = /^\s+$/.test(tok.t);
    const line = lines[lines.length - 1];
    if (space && !line.length) continue;
    if (!space && line.length && widths[widths.length - 1] + w > maxWidth) {
      while (line.length && /^\s+$/.test(line[line.length - 1].t)) widths[widths.length - 1] -= line.pop().w;
      lines.push([]);
      widths.push(0);
    }
    lines[lines.length - 1].push({ ...tok, w });
    widths[widths.length - 1] += w;
  }

  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    let x = cx - widths[i] / 2;
    for (const tok of line) {
      ctx.font = fontFor(tok.bold);
      ctx.fillStyle = tok.bold ? style.boldColor : style.color;
      ctx.fillText(tok.t, x, y + i * lineHeight);
      x += tok.w;
    }
  });
  return y + lines.length * lineHeight;
}

/** The pageant crown (same shape as the website logo), centered at cx with the given width. */
function drawCrown(ctx, cx, cy, width, { jewel = C.rose } = {}) {
  const s = width / 64;
  ctx.save();
  ctx.translate(cx - 32 * s, cy - 24 * s);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, 0, 0, 48);
  g.addColorStop(0, C.gold200);
  g.addColorStop(1, '#c08a36');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(8, 36); ctx.lineTo(4, 10); ctx.lineTo(18, 22); ctx.lineTo(32, 4);
  ctx.lineTo(46, 22); ctx.lineTo(60, 10); ctx.lineTo(56, 36); ctx.closePath();
  ctx.fill();
  roundRectPath(ctx, 8, 39, 48, 6, 2);
  ctx.fill();
  const dot = (x, y, r, color) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = color; ctx.fill(); };
  dot(32, 4, 3.2, jewel);
  dot(4, 10, 2.6, C.gold200);
  dot(60, 10, 2.6, C.gold200);
  dot(32, 26, 3, jewel);
  ctx.restore();
}

/** Fine guilloché rosette — the security-print look used on certificates and notes. */
function rosette(ctx, cx, cy, R, amp, waves, strands, color, alpha, lineWidth) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (let k = 0; k < strands; k++) {
    const phase = (k / strands) * TAU;
    ctx.beginPath();
    for (let t = 0; t <= TAU + 0.002; t += 0.004) {
      const r = R + amp * Math.sin(waves * t + phase);
      const x = cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Diagonal fine-line texture for dark bands. */
function hatch(ctx, x, y, w, h, gap, color, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = -h; i < w; i += gap) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

function diamond(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Horizontal gold rule that fades out at both ends, with a diamond in the middle. */
function ornamentRule(ctx, cx, y, halfWidth, lineWidth, gem = true) {
  const g = ctx.createLinearGradient(cx - halfWidth, 0, cx + halfWidth, 0);
  g.addColorStop(0, 'rgba(214,162,76,0)');
  g.addColorStop(0.5, C.gold);
  g.addColorStop(1, 'rgba(214,162,76,0)');
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(cx - halfWidth, y);
  ctx.lineTo(cx + halfWidth, y);
  ctx.stroke();
  if (gem) {
    diamond(ctx, cx, y, lineWidth * 5, C.gold);
    diamond(ctx, cx, y, lineWidth * 2.2, C.ivory);
  }
  ctx.restore();
}

/** Filigree corner: double L-frame, a sweeping curl and gems. (sx, sy) = ±1 to mirror. */
function cornerOrnament(ctx, x, y, sx, sy, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = goldLinear(ctx, 0, 0, s, s);
  ctx.lineCap = 'round';

  ctx.lineWidth = s * 0.028;
  ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(0, 0); ctx.lineTo(s, 0); ctx.stroke();
  ctx.lineWidth = s * 0.012;
  ctx.beginPath(); ctx.moveTo(s * 0.07, s * 0.82); ctx.lineTo(s * 0.07, s * 0.07); ctx.lineTo(s * 0.82, s * 0.07); ctx.stroke();

  ctx.lineWidth = s * 0.016;
  ctx.beginPath();
  ctx.moveTo(s * 0.14, s * 0.62);
  ctx.bezierCurveTo(s * 0.14, s * 0.3, s * 0.3, s * 0.14, s * 0.62, s * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.62, s * 0.14);
  ctx.bezierCurveTo(s * 0.5, s * 0.24, s * 0.4, s * 0.2, s * 0.44, s * 0.3);
  ctx.moveTo(s * 0.14, s * 0.62);
  ctx.bezierCurveTo(s * 0.24, s * 0.5, s * 0.2, s * 0.4, s * 0.3, s * 0.44);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(s * 0.2, s * 0.2, s * 0.06, 0, TAU);
  ctx.stroke();
  diamond(ctx, s * 0.2, s * 0.2, s * 0.035, C.rose);
  diamond(ctx, s * 0.82, s * 0.07, s * 0.03, C.gold);
  diamond(ctx, s * 0.07, s * 0.82, s * 0.03, C.gold);
  ctx.restore();
}

/** Text laid out along a circle, centered at the top. */
function arcText(ctx, text, cx, cy, radius, startAngle = -Math.PI / 2, spacing = 0) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = startAngle - total / radius / 2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const a = angle + widths[i] / radius / 2;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += widths[i] / radius;
  });
  ctx.restore();
}

/** Gold starburst seal with circular lettering. */
function drawSeal(ctx, cx, cy, R, { top = 'OFFICIAL SEAL', center = '2026' } = {}) {
  ctx.save();
  ctx.shadowColor = 'rgba(80, 45, 10, 0.35)';
  ctx.shadowBlur = R * 0.12;
  ctx.shadowOffsetY = R * 0.04;
  const spikes = 60;
  ctx.beginPath();
  for (let i = 0; i <= spikes * 2; i++) {
    const r = i % 2 ? R * 0.94 : R;
    const a = (i / (spikes * 2)) * TAU;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  const rg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  rg.addColorStop(0, C.gold200);
  rg.addColorStop(0.6, C.gold);
  rg.addColorStop(1, C.gold600);
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.8, 0, TAU);
  ctx.fillStyle = linear(ctx, cx, cy - R, cx, cy + R, C.plum700, C.plum950);
  ctx.fill();
  ctx.lineWidth = R * 0.025;
  ctx.strokeStyle = C.gold300;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.56, 0, TAU);
  ctx.lineWidth = R * 0.015;
  ctx.stroke();
  rosette(ctx, cx, cy, R * 0.44, R * 0.05, 18, 4, C.gold300, 0.35, R * 0.006);

  ctx.fillStyle = C.gold300;
  ctx.font = F.display(700, R * 0.1);
  arcText(ctx, `★ ${top} ★`, cx, cy, R * 0.68, -Math.PI / 2, R * 0.012);
  ctx.font = F.display(700, R * 0.085);
  bottomArcText(ctx, 'MR · MISS · MRS INDIA', cx, cy, R * 0.68, R * 0.01);
  ctx.restore();

  drawCrown(ctx, cx, cy - R * 0.14, R * 0.46);
  ctx.save();
  ctx.fillStyle = goldLinear(ctx, cx, cy, cx, cy + R * 0.3);
  ctx.font = F.display(800, R * 0.2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(center, cx, cy + R * 0.2);
  ctx.restore();
}

/** Text along the bottom of a circle, readable left→right. */
function bottomArcText(ctx, text, cx, cy, radius, spacing = 0) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = Math.PI / 2 + total / radius / 2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const a = angle - widths[i] / radius / 2;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.rotate(a - Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle -= widths[i] / radius;
  });
  ctx.restore();
}

function initials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '★';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return value || '—';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  return { canvas, ctx };
}

/* ------------------------------------------------------------------ */
/* Certificate                                                         */
/* ------------------------------------------------------------------ */

const AWARD_COPY = {
  Participation: { kind: 'OF PARTICIPATION', lead: 'for participating in' },
  Winner: { kind: 'OF ACHIEVEMENT', lead: 'for being crowned the' },
  '1st Runner-Up': { kind: 'OF ACHIEVEMENT', lead: 'for being declared the' },
  '2nd Runner-Up': { kind: 'OF ACHIEVEMENT', lead: 'for being declared the' },
  'Special Award': { kind: 'OF EXCELLENCE', lead: 'for receiving a Special Award at' },
};

/**
 * @param {{ fullName: string, category?: string, regId: string, award?: string }} data
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function drawCertificate(data) {
  await loadFonts();
  const W = CERT_W;
  const H = CERT_H;
  const cx = W / 2;
  const { canvas, ctx } = makeCanvas(W, H);
  const award = AWARD_COPY[data.award] ? data.award : 'Participation';
  const copy = AWARD_COPY[award];
  const category = data.category || 'Mr. Miss. & Mrs. India';

  // Paper
  const paper = ctx.createRadialGradient(cx, H * 0.45, 200, cx, H * 0.5, W * 0.62);
  paper.addColorStop(0, '#fffdf8');
  paper.addColorStop(0.65, '#fbf3e4');
  paper.addColorStop(1, '#efe0c4');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  // Security watermark
  rosette(ctx, cx, H * 0.53, 760, 70, 36, 6, C.gold600, 0.07, 2.4);
  rosette(ctx, cx, H * 0.53, 520, 46, 28, 5, C.wine, 0.05, 2);
  ctx.save();
  ctx.globalAlpha = 0.045;
  drawCrown(ctx, cx, H * 0.52, 900);
  ctx.restore();

  // Frame: plum band with gold edges
  const m = 80; // outer margin (keeps the frame clear of printer margins)
  const band = 70;
  ctx.save();
  ctx.fillStyle = linear(ctx, 0, 0, W, H, C.plum800, C.plum950);
  ctx.beginPath();
  ctx.rect(m, m, W - 2 * m, H - 2 * m);
  ctx.rect(m + band, m + band, W - 2 * (m + band), H - 2 * (m + band));
  ctx.fill('evenodd');
  hatch(ctx, m, m, W - 2 * m, band, 14, C.gold300, 0.12);
  hatch(ctx, m, H - m - band, W - 2 * m, band, 14, C.gold300, 0.12);
  hatch(ctx, m, m, band, H - 2 * m, 14, C.gold300, 0.12);
  hatch(ctx, W - m - band, m, band, H - 2 * m, 14, C.gold300, 0.12);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = goldLinear(ctx, 0, 0, W, H);
  ctx.lineWidth = 10;
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  ctx.lineWidth = 8;
  ctx.strokeRect(m + band, m + band, W - 2 * (m + band), H - 2 * (m + band));
  ctx.lineWidth = 3;
  const inner = m + band + 36;
  ctx.strokeRect(inner, inner, W - 2 * inner, H - 2 * inner);
  ctx.restore();

  // Gems along the band
  for (const [x, y] of [[cx, m + band / 2], [cx, H - m - band / 2], [m + band / 2, H / 2], [W - m - band / 2, H / 2]]) {
    diamond(ctx, x, y, 26, C.gold);
    diamond(ctx, x, y, 12, C.rose);
  }

  // Corners
  const cs = 330;
  const co = m + band + 16;
  cornerOrnament(ctx, co, co, 1, 1, cs);
  cornerOrnament(ctx, W - co, co, -1, 1, cs);
  cornerOrnament(ctx, co, H - co, 1, -1, cs);
  cornerOrnament(ctx, W - co, H - co, -1, -1, cs);

  // Header
  drawCrown(ctx, cx, 350, 230);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.plum700;
  ctx.font = F.display(700, 50);
  spacedText(ctx, "GLOBAL INDIA'S BIGGEST BEAUTY PAGEANT", cx, 510, 12);
  ctx.fillStyle = C.wine600;
  ctx.font = F.body(500, 40);
  spacedText(ctx, `PRESENTED BY ${EVENT.presentedBy.toUpperCase()}`, cx, 572, 6);

  // Title
  ctx.save();
  ctx.font = F.script(290);
  ctx.fillStyle = goldLinear(ctx, cx, 620, cx, 900);
  ctx.shadowColor = 'rgba(125, 85, 24, 0.25)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.textAlign = 'center';
  ctx.fillText('Certificate', cx, 850);
  ctx.restore();

  ctx.font = F.display(800, 84);
  ctx.fillStyle = C.wine;
  const kw = spacedText(ctx, copy.kind, cx, 1040, 26);
  ornamentRule(ctx, cx - kw / 2 - 260, 1012, 200, 4, false);
  ornamentRule(ctx, cx + kw / 2 + 260, 1012, 200, 4, false);
  diamond(ctx, cx - kw / 2 - 50, 1012, 14, C.gold);
  diamond(ctx, cx + kw / 2 + 50, 1012, 14, C.gold);

  ctx.font = F.serif(500, 62, true);
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.fillText('This certificate is proudly presented to', cx, 1165);

  // Recipient
  const nameSize = fitFont(ctx, data.fullName, 2300, (s) => F.script(s), 250, 120);
  ctx.save();
  ctx.fillStyle = linear(ctx, cx, 1180, cx, 1400, C.plum700, C.plum950);
  ctx.textAlign = 'center';
  ctx.fillText(data.fullName, cx, 1370 + (250 - nameSize) * 0.25);
  ctx.restore();
  ornamentRule(ctx, cx, 1440, 1100, 5);

  // Citation
  const where = `${EVENT.venue}, ${EVENT.city}`;
  const segments = award === 'Participation'
    ? [
      { text: `${copy.lead} ` },
      { text: 'Mr. Miss. & Mrs. India 2026', bold: true },
      { text: ' in the ' },
      { text: `${category}`, bold: true },
      { text: ' category, held at the ' },
      { text: where, bold: true },
      { text: ' on ' },
      { text: EVENT.finaleDate, bold: true },
      { text: '. We applaud your grace, confidence and spirit — keep shining.' },
    ]
    : award === 'Special Award'
      ? [
        { text: `${copy.lead} ` },
        { text: 'Mr. Miss. & Mrs. India 2026', bold: true },
        { text: ` (${category}), held at the ` },
        { text: where, bold: true },
        { text: ' on ' },
        { text: EVENT.finaleDate, bold: true },
        { text: ', in recognition of outstanding talent and poise.' },
      ]
      : [
        { text: `${copy.lead} ` },
        { text: `${award} — ${category} 2026`, bold: true },
        { text: ' at Global India\'s Biggest Beauty Pageant, held at the ' },
        { text: where, bold: true },
        { text: ' on ' },
        { text: EVENT.finaleDate, bold: true },
        { text: '. Congratulations on this remarkable achievement.' },
      ];
  richParagraph(ctx, segments, cx, 1560, 2350, 80, {
    regular: F.body(400, 52), bold: F.body(600, 52), color: C.ink, boldColor: C.wine,
  });

  // Signatures + seal
  const sigY = 2010;
  const sig = (x, title, sub) => {
    ctx.save();
    ctx.strokeStyle = C.plum700;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 330, sigY);
    ctx.lineTo(x + 330, sigY);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.plum900;
    ctx.font = F.display(700, 44);
    spacedText(ctx, title, x, sigY + 70, 6);
    ctx.fillStyle = C.muted;
    ctx.font = F.body(400, 36);
    ctx.fillText(sub, x, sigY + 122);
    ctx.restore();
  };
  sig(860, 'ORGANIZER', EVENT.presentedBy);
  sig(W - 860, 'EVENT DIRECTOR', 'Mr. Miss. & Mrs. India 2026');
  drawSeal(ctx, cx, 1982, 208, { top: award === 'Participation' ? 'OFFICIAL SEAL' : award.toUpperCase() });

  // Footer strip
  ctx.fillStyle = C.plum700;
  ctx.font = F.body(500, 34);
  ctx.textAlign = 'center';
  const certNo = `${data.regId}-${award === 'Participation' ? 'P' : award === 'Winner' ? 'W' : award === 'Special Award' ? 'S' : 'R'}`;
  spacedText(ctx, `CERTIFICATE NO. ${certNo}   ·   ${EVENT.finaleDate.toUpperCase()}   ·   ${where.toUpperCase()}`, cx, H - inner - 44, 4);

  return canvas;
}

/* ------------------------------------------------------------------ */
/* ID card — front                                                     */
/* ------------------------------------------------------------------ */

/**
 * @param {object} data
 *   contestant: { kind:'contestant', fullName, category, regId, phone, city, state, dob, photo, status }
 *   team:       { kind:'team', name, designation, department, teamId, phone, bloodGroup, validTill, photo }
 */
export async function drawIdCardFront(data) {
  await loadFonts();
  const W = CARD_W;
  const H = CARD_H;
  const cx = W / 2;
  const { canvas, ctx } = makeCanvas(W, H);
  const isTeam = data.kind === 'team';
  const theme = isTeam ? CATEGORY_THEME.team : CATEGORY_THEME[data.category] || CATEGORY_THEME.none;
  const name = (isTeam ? data.name : data.fullName) || '';
  const photo = await loadImage(data.photo);

  // Body
  ctx.fillStyle = linear(ctx, 0, 0, 0, H, '#fffaf2', '#f5e8d3');
  ctx.fillRect(0, 0, W, H);
  rosette(ctx, cx, 1230, 420, 34, 22, 5, C.gold600, 0.08, 1.6);

  // Header
  const headH = 560;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, headH - 90);
  ctx.quadraticCurveTo(cx, headH + 70, 0, headH - 90);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = linear(ctx, 0, 0, 0, headH, C.plum800, C.plum950);
  ctx.fillRect(0, 0, W, headH);
  const glow = ctx.createRadialGradient(W * 0.85, 40, 10, W * 0.85, 40, 520);
  glow.addColorStop(0, `${theme.from}88`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, headH);
  const glow2 = ctx.createRadialGradient(0, headH, 10, 0, headH, 460);
  glow2.addColorStop(0, 'rgba(214,162,76,0.35)');
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, headH);
  rosette(ctx, cx, 250, 380, 26, 20, 4, C.gold300, 0.12, 1.4);
  ctx.restore();

  // Gold edge under the header curve
  ctx.save();
  ctx.strokeStyle = goldLinear(ctx, 0, 0, W, 0);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, headH - 90);
  ctx.quadraticCurveTo(cx, headH + 70, W, headH - 90);
  ctx.stroke();
  ctx.restore();

  // Lanyard slot
  roundRectPath(ctx, cx - 95, 44, 190, 34, 17);
  ctx.fillStyle = 'rgba(255,248,239,0.9)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.gold;
  ctx.stroke();

  drawCrown(ctx, cx, 150, 104);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ivory;
  ctx.font = F.display(800, 50);
  spacedText(ctx, 'MR. MISS. & MRS. INDIA', cx, 250, 5);
  ctx.save();
  ctx.font = F.display(800, 64);
  ctx.fillStyle = goldLinear(ctx, cx, 262, cx, 320);
  spacedText(ctx, '2026', cx, 322, 18);
  ctx.restore();
  ctx.fillStyle = C.gold300;
  ctx.font = F.body(500, 25);
  spacedText(ctx, "GLOBAL INDIA'S BIGGEST BEAUTY PAGEANT", cx, 368, 3);

  // Photo (arch)
  const pw = 420;
  const ph = 500;
  const px = cx - pw / 2;
  const py = 410;
  ctx.save();
  ctx.shadowColor = 'rgba(18,5,26,0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  archPath(ctx, px - 16, py - 16, pw + 32, ph + 32, 40);
  ctx.fillStyle = goldLinear(ctx, px, py, px + pw, py + ph);
  ctx.fill();
  ctx.restore();
  archPath(ctx, px - 5, py - 5, pw + 10, ph + 10, 32);
  ctx.fillStyle = C.ivory;
  ctx.fill();
  ctx.save();
  archPath(ctx, px, py, pw, ph, 28);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, px, py, pw, ph, 0.25);
  } else {
    ctx.fillStyle = linear(ctx, px, py, px, py + ph, theme.from, theme.to);
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = F.display(700, 170);
    ctx.textAlign = 'center';
    ctx.fillText(initials(name), cx, py + ph / 2 + 60);
  }
  ctx.restore();

  // Status tag on the photo (contestants)
  if (!isTeam) {
    const confirmed = data.status === 'confirmed';
    const label = confirmed ? 'CONFIRMED' : 'PROVISIONAL';
    ctx.font = F.body(600, 24);
    const tw = spacedWidth(ctx, label, 3) + 48;
    roundRectPath(ctx, cx - tw / 2, py + ph - 26, tw, 52, 26);
    ctx.fillStyle = confirmed ? '#1f7a45' : '#b7791f';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.ivory;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    spacedText(ctx, label, cx, py + ph + 9, 3);
  }

  // Ribbon (category / designation)
  const ribbonText = isTeam ? (data.designation || 'TEAM').toUpperCase() : theme.label;
  const ry = 968;
  const rSize = fitFont(ctx, ribbonText, 640, (s) => F.display(800, s), 44, 26, 6);
  const rw = Math.min(820, spacedWidth(ctx, ribbonText, 6 * (rSize / 44)) + 150);
  ctx.save();
  ctx.fillStyle = theme.to;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * (rw / 2 - 10);
    ctx.beginPath();
    ctx.moveTo(ex, ry + 12);
    ctx.lineTo(ex + dir * 60, ry + 12);
    ctx.lineTo(ex + dir * 36, ry + 46);
    ctx.lineTo(ex + dir * 60, ry + 80);
    ctx.lineTo(ex, ry + 80);
    ctx.closePath();
    ctx.fill();
  }
  roundRectPath(ctx, cx - rw / 2, ry, rw, 80, 12);
  ctx.fillStyle = linear(ctx, cx - rw / 2, 0, cx + rw / 2, 0, theme.from, theme.to);
  ctx.shadowColor = 'rgba(18,5,26,0.3)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRectPath(ctx, cx - rw / 2 + 8, ry + 8, rw - 16, 64, 8);
  ctx.strokeStyle = 'rgba(247,226,161,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = F.display(800, rSize);
  spacedText(ctx, ribbonText, cx, ry + 40 + rSize * 0.36, 6 * (rSize / 44));
  ctx.restore();

  // Name
  const nSize = fitFont(ctx, name, 940, (s) => F.serif(700, s), 76, 40);
  ctx.fillStyle = C.plum900;
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, 1140 + (76 - nSize) * 0.3);
  ctx.fillStyle = C.gold600;
  ctx.font = F.display(700, 26);
  spacedText(ctx, isTeam ? (data.department || 'ORGANIZING COMMITTEE').toUpperCase() : 'OFFICIAL CONTESTANT', cx, 1190, 8);

  // Details
  const rows = isTeam
    ? [
      ['TEAM ID', data.teamId], ['MOBILE', data.phone ? `+91 ${data.phone}` : '—'],
      ['BLOOD GROUP', data.bloodGroup || '—'], ['VALID TILL', shortDate(data.validTill)],
    ]
    : [
      ['REGISTRATION ID', data.regId], ['MOBILE', data.phone ? `+91 ${data.phone}` : '—'],
      ['CITY / STATE', [data.city, data.state].filter(Boolean).join(', ') || '—'], ['DATE OF BIRTH', shortDate(data.dob)],
    ];
  const boxX = 70;
  const boxY = 1232;
  const boxW = W - 140;
  const boxH = 250;
  roundRectPath(ctx, boxX, boxY, boxW, boxH, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(214,162,76,0.55)';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, boxY + 30); ctx.lineTo(cx, boxY + boxH - 30);
  ctx.moveTo(boxX + 30, boxY + boxH / 2); ctx.lineTo(boxX + boxW - 30, boxY + boxH / 2);
  ctx.strokeStyle = 'rgba(214,162,76,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  rows.forEach(([label, value], i) => {
    const colX = i % 2 === 0 ? boxX + boxW / 4 : boxX + (boxW * 3) / 4;
    const rowY = boxY + (i < 2 ? 0 : boxH / 2);
    ctx.fillStyle = C.muted;
    ctx.font = F.body(600, 22);
    spacedText(ctx, label, colX, rowY + 52, 3);
    const vSize = fitFont(ctx, String(value || '—'), boxW / 2 - 50, (s) => F.body(600, s), 36, 20);
    ctx.fillStyle = i === 0 ? theme.to : C.ink;
    ctx.textAlign = 'center';
    ctx.fillText(String(value || '—'), colX, rowY + 100 + (36 - vSize) * 0.3);
  });

  // Footer band
  const fy = 1528;
  ctx.fillStyle = linear(ctx, 0, fy, 0, H, C.plum800, C.plum950);
  ctx.fillRect(0, fy, W, H - fy);
  hatch(ctx, 0, fy, W, H - fy, 16, C.gold300, 0.08);
  ctx.fillStyle = goldLinear(ctx, 0, 0, W, 0);
  ctx.fillRect(0, fy, W, 7);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold300;
  ctx.font = F.display(700, 34);
  spacedText(ctx, `GRAND FINALE · ${EVENT.finaleDate.toUpperCase()}`, cx, fy + 68, 4);
  ctx.fillStyle = C.ivory;
  ctx.font = F.body(500, 28);
  ctx.fillText(`${EVENT.venue}, ${EVENT.city}`, cx, fy + 114);
  ctx.fillStyle = 'rgba(255,248,239,0.6)';
  ctx.font = F.body(400, 22);
  ctx.fillText(`Presented by ${EVENT.presentedBy}`, cx, fy + 156);

  return canvas;
}

/* ------------------------------------------------------------------ */
/* ID card — back                                                      */
/* ------------------------------------------------------------------ */

export async function drawIdCardBack(data) {
  await loadFonts();
  const W = CARD_W;
  const H = CARD_H;
  const cx = W / 2;
  const { canvas, ctx } = makeCanvas(W, H);
  const isTeam = data.kind === 'team';
  const theme = isTeam ? CATEGORY_THEME.team : CATEGORY_THEME[data.category] || CATEGORY_THEME.none;

  ctx.fillStyle = linear(ctx, 0, 0, 0, H, '#fffaf2', '#f5e8d3');
  ctx.fillRect(0, 0, W, H);
  rosette(ctx, cx, H / 2, 470, 40, 26, 6, C.gold600, 0.07, 1.6);
  ctx.save();
  ctx.globalAlpha = 0.05;
  drawCrown(ctx, cx, H / 2, 560);
  ctx.restore();

  // Header band
  const hh = 250;
  ctx.fillStyle = linear(ctx, 0, 0, W, hh, C.plum800, C.plum950);
  ctx.fillRect(0, 0, W, hh);
  hatch(ctx, 0, 0, W, hh, 16, C.gold300, 0.08);
  ctx.fillStyle = linear(ctx, 0, 0, W, 0, theme.from, theme.to);
  ctx.fillRect(0, hh, W, 10);
  ctx.fillStyle = goldLinear(ctx, 0, 0, W, 0);
  ctx.fillRect(0, hh + 10, W, 5);
  roundRectPath(ctx, cx - 95, 44, 190, 34, 17);
  ctx.fillStyle = 'rgba(255,248,239,0.9)';
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold300;
  ctx.font = F.display(800, 44);
  spacedText(ctx, isTeam ? 'TEAM GUIDELINES' : 'CONTESTANT GUIDELINES', cx, 160, 6);
  ctx.fillStyle = 'rgba(255,248,239,0.7)';
  ctx.font = F.body(400, 26);
  ctx.fillText('Please read and follow at the venue', cx, 208);

  const rules = isTeam
    ? [
      'Wear this card visibly at all times during the event.',
      'Assist contestants, guests and media with courtesy.',
      'Report to the event director before every session.',
      'This card is non-transferable and remains the property of the organizers.',
      'If found, please return it to the registration desk.',
    ]
    : [
      'Wear this card visibly at all times at the venue.',
      'Carry a valid government photo ID along with this card.',
      'Report 60 minutes before your audition / rehearsal slot.',
      'Follow the grooming schedule and the organizers\' decisions.',
      'This card is non-transferable. If found, please return it to the organizers.',
    ];
  let y = 350;
  ctx.textAlign = 'left';
  rules.forEach((rule, i) => {
    ctx.beginPath();
    ctx.arc(110, y - 12, 26, 0, TAU);
    ctx.fillStyle = linear(ctx, 84, y - 38, 136, y + 14, theme.from, theme.to);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = F.body(600, 26);
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), 110, y - 3);
    ctx.textAlign = 'left';
    y = wrapLeft(ctx, rule, 160, y, W - 230, 44, F.body(400, 30), C.ink) + 30;
  });

  // Key dates
  const boxY = Math.max(y + 10, 1010);
  roundRectPath(ctx, 70, boxY, W - 140, 250, 26);
  ctx.fillStyle = linear(ctx, 70, boxY, W - 70, boxY + 250, C.plum800, C.plum950);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold300;
  ctx.font = F.display(700, 26);
  spacedText(ctx, 'KEY DATES', cx, boxY + 52, 8);
  const dates = [['LIVE AUDITION / GROOMING', EVENT.auditionDate], ['GRAND FINALE', EVENT.finaleDate]];
  dates.forEach(([label, value], i) => {
    const x = 70 + (W - 140) * (i ? 0.75 : 0.25);
    ctx.fillStyle = 'rgba(255,248,239,0.65)';
    ctx.font = F.body(500, 20);
    spacedText(ctx, label, x, boxY + 118, 2);
    ctx.fillStyle = C.ivory;
    ctx.font = F.serif(700, 40);
    ctx.fillText(value, x, boxY + 170);
  });
  ctx.fillStyle = C.gold300;
  ctx.font = F.body(500, 24);
  ctx.fillText(`${EVENT.venue}, ${EVENT.city}`, cx, boxY + 222);

  // Helpline
  const hy = boxY + 320;
  ctx.fillStyle = C.muted;
  ctx.font = F.body(600, 22);
  spacedText(ctx, 'REGISTRATION HELPLINE / WHATSAPP', cx, hy, 3);
  ctx.fillStyle = C.plum900;
  ctx.font = F.body(600, 36);
  ctx.fillText(EVENT.phones.join('   ·   '), cx, hy + 52);

  // Signature
  const sy = H - 150;
  ctx.strokeStyle = C.plum700;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(W - 430, sy); ctx.lineTo(W - 90, sy);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = F.body(500, 22);
  ctx.textAlign = 'center';
  ctx.fillText('Authorised Signatory', W - 260, sy + 38);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.plum700;
  ctx.font = F.display(700, 26);
  ctx.fillText(isTeam ? data.teamId : data.regId, 90, sy - 8);
  ctx.fillStyle = C.muted;
  ctx.font = F.body(400, 22);
  ctx.fillText(isTeam ? 'Team ID' : 'Registration ID', 90, sy + 30);

  ctx.fillStyle = goldLinear(ctx, 0, 0, W, 0);
  ctx.fillRect(0, H - 56, W, 56);
  ctx.fillStyle = C.plum950;
  ctx.font = F.display(700, 22);
  ctx.textAlign = 'center';
  spacedText(ctx, `PRESENTED BY ${EVENT.presentedBy.toUpperCase()}`, cx, H - 20, 3);

  return canvas;
}

function wrapLeft(ctx, text, x, y, maxWidth, lineHeight, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

/* ------------------------------------------------------------------ */
/* Export helpers                                                      */
/* ------------------------------------------------------------------ */

export function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), type, quality);
  });
}

export async function downloadCanvas(canvas, filename, type = 'image/png') {
  const blob = await canvasToBlob(canvas, type);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Prints canvases at their exact physical size (one per page) through a hidden iframe,
 * so no pop-up blocker gets in the way. The browser's print dialog can also "Save as PDF".
 */
export async function printCanvases(canvases, { widthMm, heightMm }) {
  const urls = await Promise.all(canvases.map(async (c) => URL.createObjectURL(await canvasToBlob(c))));
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><title>Print</title><style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    img { display: block; width: ${widthMm}mm; height: ${heightMm}mm; page-break-after: always; break-after: page; }
    img:last-child { page-break-after: auto; break-after: auto; }
  </style></head><body>${urls.map((u) => `<img src="${u}" alt="">`).join('')}</body></html>`);
  doc.close();

  const imgs = [...doc.images];
  await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => {
    iframe.remove();
    urls.forEach((u) => URL.revokeObjectURL(u));
  }, 60000);
}

export const PRINT_SIZES = {
  certificate: { widthMm: 297, heightMm: 210 },
  card: { widthMm: 54, heightMm: 85.6 },
};
