# Hostinger (Premium Web Hosting) par live karna

Yeh `Backend-PHP/` purane Node backend (`Backend/`) ka PHP version hai. Isme same API, same fields aur same
MySQL tables hain. Frontend React hi rahega. Poori site (frontend + backend) `public_html` me ek saath chalti hai:

```
public_html/
  index.html, assets/, images/   ← React build (Frontend/dist)
  .htaccess                      ← /api → PHP, baaki sab → React
  server/                        ← PHP backend (.env, code, private documents — bahar se nahi khulte)
  uploads/                       ← photos / blog media
```

## 1. Package banao (apne PC par)

```bash
cd Backend-PHP
npm run package
```
Isse `hostinger/public_html.zip` banega.

## 2. MySQL database banao (hPanel)

hPanel → **Websites** → apni website (jaise `lemonchiffon-snail-692059.hostingersite.com`) → **Dashboard**
→ **Databases → Management** → naya database banayein:

- Database name: `missindia`, jo Hostinger me `u123456789_missindia` ban jayega
- Username: `missindia`, jo `u123456789_missindia` ban jayega
- Password: ek strong password

Teeno values note kar lein. Tables khud ban jayengi, kuch import nahi karna.

## 3. Files upload karo

Usi website ke Dashboard → **Files → File Manager** → `public_html` folder kholein.

1. Wahan pehle se padi default files (`default.php` waghera) delete kar dein.
2. `public_html.zip` upload karein → us par right-click → **Extract** → Extract karte waqt folder ka naam khaali chhod dein ya `.` rakhein.
3. Check karein ki `index.html`, `.htaccess`, `server/` aur `uploads/` **seedhe `public_html` ke andar** hain, kisi aur folder me nahi.
4. Ab `public_html.zip` delete kar dein.

## 4. `.env` banao

File Manager → `public_html/server/` → `.env.example` ko copy karke naam `.env` rakhein, phir edit karein:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_missindia
DB_PASSWORD=<database ka password>
DB_NAME=u123456789_missindia
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<admin panel ka strong password>
JWT_SECRET=<kam se kam 40 random letters/numbers>
```
> Dotfiles (`.env`, `.htaccess`) na dikhein to File Manager ki settings me **Show hidden files** on karein.
>
> Shortcut: yahi content apne PC par `Backend-PHP/server/.env.production` me save kar dein.
> Phir `npm run package` usse zip me `server/.env` ke roop me khud daal dega.

## 5. PHP settings (hPanel)

Website Dashboard → **Advanced → PHP Configuration**:

- **PHP version:** 8.2 ya usse naya
- **PHP options:** `upload_max_filesize = 200M`, `post_max_size = 210M`, `max_execution_time = 300`, `memory_limit = 256M` (blog videos ke liye)

## 6. Check karo

- `https://<aapki-site>/api/health` → `{"ok":true,...}` aana chahiye
- `https://<aapki-site>/` → website
- `https://<aapki-site>/admin` → `.env` wale ADMIN_USERNAME / ADMIN_PASSWORD se login

Error aaye to `public_html/server/data/php-error.log` dekhein.

## Baad me update kaise karein

`npm run package` chalayein, phir naya zip upload karke **Extract** karein. Zip me `.env` aur uploaded
photos nahi hote (jab tak `.env.production` na ho), isliye server ka data safe rehta hai.

## Local par chalana

```bash
cd Backend-PHP && npm run dev      # PHP API → http://localhost:6869
cd Frontend    && npm run dev      # React    → http://localhost:5173  (/api yahin se proxy hota hai)
```
Local `.env` → `Backend-PHP/server/.env` (Node wale `Backend/.env` jaisi hi keys hain).
