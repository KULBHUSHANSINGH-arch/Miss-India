// MySQL connection pool. On startup it creates the database and tables if they
// don't exist yet (see schema.sql), so a fresh install only needs .env values.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { seedPosts } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_NAME = process.env.DB_NAME || 'miss_india';
if (!/^\w+$/.test(DB_NAME)) throw new Error('DB_NAME may only contain letters, numbers and _');

const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4',
  // Keep DATE columns as plain 'YYYY-MM-DD' strings so birthdays never shift by timezone.
  typeCast(field, next) {
    if (field.type === 'DATE') return field.string();
    return next();
  },
};

let pool;

export async function initDb() {
  const boot = await mysql.createConnection(connection);
  await boot.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await boot.end();

  pool = mysql.createPool({ ...connection, database: DB_NAME, connectionLimit: 10 });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  for (const stmt of schema.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
    await pool.query(stmt);
  }

  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM posts');
  if (n === 0) {
    for (const p of seedPosts()) {
      await pool.query(
        `INSERT INTO posts (id, slug, type, title, excerpt, category, cover_image, status, blocks, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.slug, p.type || 'blog', p.title, p.excerpt, p.category, p.coverImage, p.status, JSON.stringify(p.blocks),
          new Date(p.createdAt), new Date(p.updatedAt)],
      );
    }
  }
  // Details for the startup banner.
  const [[{ version }]] = await pool.query('SELECT VERSION() AS version');
  const tables = await pool.query(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [DB_NAME],
  ).then(([rows]) => rows.map((r) => r.name));
  const counts = {};
  for (const t of tables) {
    const [[{ c }]] = await pool.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    counts[t] = Number(c);
  }
  return { name: DB_NAME, host: `${connection.host}:${connection.port}`, user: connection.user, version, counts };
}

/** Runs a query and returns the rows (or the result header for INSERT/UPDATE). */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
