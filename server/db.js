// Tiny JSON-file database. Good for a single-server event website;
// swap for MongoDB/Postgres later without touching the routes' shape.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedPosts } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const emptyDb = () => ({
  posts: [],
  registrations: [],
  team: [],
  counters: { registration: 0, team: 0 },
});

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const fresh = emptyDb();
    fresh.posts = seedPosts();
    write(fresh);
    return fresh;
  }
  return { ...emptyDb(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
}

function write(data) {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

const data = load();

export const db = {
  data,
  save: () => write(data),
  nextId(counter) {
    data.counters[counter] = (data.counters[counter] || 0) + 1;
    return data.counters[counter];
  },
};
