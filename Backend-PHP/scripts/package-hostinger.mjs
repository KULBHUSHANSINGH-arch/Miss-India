// Builds the React app and puts it together with the PHP backend in one folder + zip
// that you upload to Hostinger's public_html:
//
//   hostinger/public_html/        ← what the site looks like on the server
//   hostinger/public_html.zip     ← upload this in hPanel → File Manager → public_html, then Extract
//
// If Backend-PHP/server/.env.production exists it is copied in as server/.env
// (fill it with the Hostinger database details once and every package is ready to go).
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND = path.join(ROOT, '..', 'Frontend');
const OUT_DIR = path.join(ROOT, '..', 'hostinger');
const OUT = path.join(OUT_DIR, 'public_html');
const ZIP = path.join(OUT_DIR, 'public_html.zip');

console.log('▶ Building the React app (Frontend/)…');
execSync('npm run build', { cwd: FRONTEND, stdio: 'inherit' });

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1. React build → public_html/
fs.cpSync(path.join(FRONTEND, 'dist'), OUT, { recursive: true });

// 2. PHP backend → public_html/.htaccess, public_html/server/, public_html/uploads/
const skip = (src) => {
  const rel = path.relative(ROOT, src).split(path.sep).join('/');
  if (/^server\/(\.env$|\.env\.production$|data\/.+|private_uploads\/(?!\.htaccess$).+)/.test(rel)) return false;
  if (/^uploads\/(?!\.htaccess$).+/.test(rel)) return false; // uploads made while testing locally
  return true;
};
fs.copyFileSync(path.join(ROOT, '.htaccess'), path.join(OUT, '.htaccess'));
fs.cpSync(path.join(ROOT, 'server'), path.join(OUT, 'server'), { recursive: true, filter: skip });
fs.cpSync(path.join(ROOT, 'uploads'), path.join(OUT, 'uploads'), { recursive: true, filter: skip });
fs.mkdirSync(path.join(OUT, 'server', 'data'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'server', 'private_uploads'), { recursive: true });

const prodEnv = path.join(ROOT, 'server', '.env.production');
const hasEnv = fs.existsSync(prodEnv);
if (hasEnv) fs.copyFileSync(prodEnv, path.join(OUT, 'server', '.env'));

// 3. Zip (tar ships with Windows 10+, macOS and most Linux).
try {
  const entries = fs.readdirSync(OUT).map((e) => `"${e}"`).join(' ');
  // Windows' own tar makes real .zip files (Git Bash's GNU tar can't), and a relative path avoids "D:" confusion.
  const winTar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  const tar = process.platform === 'win32' && fs.existsSync(winTar) ? `"${winTar}"` : 'tar';
  execSync(`${tar} -a -c -f "../${path.basename(ZIP)}" ${entries}`, { cwd: OUT, stdio: 'inherit' });
  console.log(`\n✓ Ready: ${path.relative(path.join(ROOT, '..'), ZIP)}`);
} catch {
  console.log(`\n✓ Ready: ${path.relative(path.join(ROOT, '..'), OUT)} (zip it yourself — "tar" was not available)`);
}
console.log(hasEnv
  ? '  server/.env was added from server/.env.production.'
  : '  ⚠ No server/.env inside — create it on Hostinger from server/.env.example (see HOSTINGER.md).');
