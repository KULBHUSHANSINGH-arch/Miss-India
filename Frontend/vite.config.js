import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API port comes from Backend/.env, so changing PORT there never breaks the frontend proxy.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function backendPort() {
  try {
    const env = fs.readFileSync(path.join(__dirname, '..', 'Backend', '.env'), 'utf8');
    const m = env.match(/^\s*PORT\s*=\s*["']?(\d+)/m);
    if (m) return m[1];
  } catch { /* no .env yet */ }
  return '6869';
}
const API = `http://localhost:${backendPort()}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API,
    },
  },
});
