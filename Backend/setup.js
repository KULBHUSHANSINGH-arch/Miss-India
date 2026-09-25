// Runs automatically before `npm run dev` / `npm start` (npm "pre" scripts).
// 1. Creates Backend/.env from .env.example if it is missing (with a random JWT secret + admin password).
// 2. Checks the MySQL login. If it fails, asks for the MySQL user/password once (hidden input),
//    verifies it, saves it to .env and creates the database + tables.
import crypto from 'crypto';
import fs from 'fs';
import net from 'net';
import { execSync } from 'child_process';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.join(__dirname, '.env');
const EXAMPLE_FILE = path.join(__dirname, '.env.example');

/* ---------- tiny .env reader / writer (keeps comments and order) ---------- */

function readEnv() {
  const text = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    values[m[1]] = v;
  }
  return { text, values };
}

const quote = (v) => {
  const s = String(v);
  if (/^[\w@.\-:/]*$/.test(s)) return s;
  return s.includes("'") ? `"${s.replace(/"/g, '\\"')}"` : `'${s}'`;
};

function writeEnv(updates) {
  let { text } = readEnv();
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${quote(value)}`;
    const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
    text = re.test(text) ? text.replace(re, () => line) : `${text.replace(/\s*$/, '')}\n${line}\n`;
  }
  fs.writeFileSync(ENV_FILE, text);
}

/* ---------- prompts ---------- */

function ask(question, { hidden = false, def = '' } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Print the question, then mute everything typed after it.
      rl._writeToOutput = (s) => { if (!rl.muted) rl.output.write(s); };
    }
    rl.question(`${question}${def ? ` (${def})` : ''}: `, (answer) => {
      if (hidden) rl.output.write('\n');
      rl.close();
      resolve(answer === '' ? def : answer);
    });
    if (hidden) rl.muted = true;
  });
}

/* ---------- MySQL check ---------- */

async function tryLogin({ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME }) {
  const conn = await mysql.createConnection({
    host: DB_HOST || 'localhost', port: Number(DB_PORT) || 3306, user: DB_USER || 'root', password: DB_PASSWORD || '',
  });
  const name = DB_NAME || 'miss_india';
  if (!/^\w+$/.test(name)) throw new Error('DB_NAME may only contain letters, numbers and _');
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();
}

const PLACEHOLDERS = new Set(['', 'your-mysql-password', 'change-this-password', 'replace-with-a-long-random-string']);

async function main() {
  // 1. .env
  if (!fs.existsSync(ENV_FILE)) {
    fs.copyFileSync(EXAMPLE_FILE, ENV_FILE);
    const adminPassword = `Admin@${crypto.randomBytes(4).toString('hex')}`;
    writeEnv({
      DB_PASSWORD: '',
      ADMIN_PASSWORD: adminPassword,
      JWT_SECRET: crypto.randomBytes(48).toString('hex'),
    });
    console.log('✓ Created Backend/.env');
    console.log(`  Admin panel login →  username: admin   password: ${adminPassword}`);
    console.log('  (change ADMIN_PASSWORD in Backend/.env any time)\n');
  } else {
    const { values } = readEnv();
    const fixes = {};
    if (PLACEHOLDERS.has(values.JWT_SECRET || '')) fixes.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    if (values.DB_PASSWORD === 'your-mysql-password') fixes.DB_PASSWORD = '';
    if (Object.keys(fixes).length) writeEnv(fixes);
  }

  // 2. MySQL login
  let env = readEnv().values;
  for (let attempt = 0; ; attempt++) {
    try {
      await tryLogin(env);
      console.log(`✓ MySQL login OK (${env.DB_USER || 'root'}@${env.DB_HOST || 'localhost'}) — database "${env.DB_NAME || 'miss_india'}" ready`);
      break;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.error('\n✗ MySQL is not running on', `${env.DB_HOST || 'localhost'}:${env.DB_PORT || 3306}`);
        console.error('  Start it: open "Services" → MySQL80 → Start   (or run as admin:  net start MySQL80)\n');
        process.exit(1);
      }
      if (err.code !== 'ER_ACCESS_DENIED_ERROR') {
        console.error('\n✗ MySQL error:', err.message, '\n');
        process.exit(1);
      }
      if (!process.stdin.isTTY) {
        console.error('\n✗ MySQL rejected the login. Put your MySQL password in Backend/.env as DB_PASSWORD=...\n');
        process.exit(1);
      }
      if (attempt >= 3) {
        console.error('\n✗ Still could not log in. Check the password in MySQL Workbench, then run npm run dev again.\n');
        process.exit(1);
      }
      console.log(attempt === 0
        ? '\nMySQL needs your login (the password you set while installing MySQL). It is asked only once and saved in Backend/.env.'
        : '✗ Wrong user or password, try again.');
      const user = await ask('MySQL user', { def: env.DB_USER || 'root' });
      const password = await ask('MySQL password (hidden)', { hidden: true });
      writeEnv({ DB_USER: user, DB_PASSWORD: password });
      env = readEnv().values;
    }
  }
}

/* ---------- make sure the API port is free ---------- */

const portFree = (port) => new Promise((resolve) => {
  const srv = net.createServer();
  srv.once('error', () => resolve(false));
  srv.once('listening', () => srv.close(() => resolve(true)));
  srv.listen(port);
});

// Which program is listening on the port (Windows: netstat + tasklist, elsewhere: lsof). Best effort.
function whoHas(port) {
  try {
    if (process.platform === 'win32') {
      const line = execSync('netstat -ano -p tcp', { encoding: 'utf8' })
        .split(/\r?\n/)
        .find((l) => new RegExp(`:${port}\\s.*LISTENING`).test(l));
      const pid = line?.trim().split(/\s+/).pop();
      if (!pid) return null;
      const name = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' }).split(',')[0]?.replace(/"/g, '');
      return { pid, name };
    }
    const pid = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim().split('\n')[0];
    return pid ? { pid, name: '' } : null;
  } catch {
    return null;
  }
}

async function freePort(port) {
  if (await portFree(port)) return;

  // Is it an old copy of THIS backend (e.g. a terminal left running)? Then stop it and take over.
  let health = null;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(2000) });
    health = await res.json();
  } catch { /* another program, or not answering */ }

  if (health?.app === 'miss-india-backend' && health.pid) {
    try { process.kill(health.pid); } catch { /* already gone */ }
    for (let i = 0; i < 20 && !(await portFree(port)); i++) await new Promise((r) => setTimeout(r, 250));
    if (await portFree(port)) {
      console.log(`↻ An old Miss India backend was still running on port ${port} (PID ${health.pid}) — stopped it.`);
      return;
    }
  }

  const who = whoHas(port);
  console.error(`\n✗ Port ${port} is used by another program${who ? ` — ${who.name || 'process'} (PID ${who.pid})` : ''}.`);
  if (who) console.error(`  Stop it with:  ${process.platform === 'win32' ? `taskkill /PID ${who.pid} /F` : `kill ${who.pid}`}`);
  console.error('  …or choose another PORT in Backend/.env (the frontend picks it up automatically).\n');
  process.exit(1);
}

main()
  .then(() => freePort(Number(readEnv().values.PORT) || 6869))
  .catch((err) => {
  console.error('✗ Setup failed:', err.message);
  process.exit(1);
});
