# Miss India 2026 — Mr. Miss. & Mrs. India

Event website + admin panel for Global India's Biggest Beauty Pageant.

```
Frontend/   React + Vite website and admin panel
Backend/    Express API + MySQL
```

## Setup

1. **MySQL** — make sure the MySQL service is running.
2. **Backend**
   ```bash
   cd Backend
   npm install
   npm run dev              # http://localhost:5000
   ```
   The first `npm run dev` creates `Backend/.env` (with a random admin password it prints once),
   asks for your MySQL user/password (hidden input), saves them, and creates the `miss_india`
   database and all tables (see `Backend/schema.sql`). After that `npm run dev` just starts.
   Run `npm run setup` any time to re-check the MySQL login.
3. **Frontend**
   ```bash
   cd Frontend
   npm install
   npm run dev              # http://localhost:5173
   ```

For production run `npm run build` in `Frontend/`; the backend then serves `Frontend/dist` itself.

## Features

- **Registration** (`/register`) — 5-step form matching the official application form.
  Only name, mobile, email and address are mandatory.
- **ID card** (`/id-card`) — 1080 × 1712 px (CR80) front & back, unlocked once the profile is complete.
- **Certificate** (`/certificate`) — A4 @ 300 dpi (3508 × 2480 px), unlocked when the admin confirms.
- **Quick enquiry** — select-only lead form (floating button + Contact page).
- **Admin** (`/admin`, shield icon top-right of the site, opens in a new tab) — dashboard,
  registrations with full data, documents, CSV export, status / award, ID card & certificate
  generation, enquiries, blog & news editor, team ID cards.

Uploaded ID proofs, payment proofs and full-length photos are stored in `Backend/private_uploads`
and are only viewable by a logged-in admin.

Event text (dates, phones, fee, venue) lives in `Frontend/src/data/event.js`.
