// Loads Backend/.env before any other module reads process.env (imported first in index.js).
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
