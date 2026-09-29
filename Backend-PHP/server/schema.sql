-- Miss India 2026 — MySQL schema.
-- The server runs this automatically on startup (CREATE TABLE IF NOT EXISTS),
-- you can also run it by hand:  mysql -u root -p miss_india < schema.sql

CREATE TABLE IF NOT EXISTS registrations (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reg_id               VARCHAR(20)  UNIQUE,
  category             VARCHAR(20)  NOT NULL DEFAULT '',

  -- 1. Applicant details (full_name, phone, email, address are mandatory)
  full_name            VARCHAR(100) NOT NULL,
  dob                  DATE         NULL,
  age                  TINYINT UNSIGNED NULL,
  gender               VARCHAR(10)  NOT NULL DEFAULT '',
  phone                CHAR(10)     NOT NULL,
  whatsapp             VARCHAR(10)  NOT NULL DEFAULT '',
  email                VARCHAR(120) NOT NULL,
  city                 VARCHAR(80)  NOT NULL DEFAULT '',
  state                VARCHAR(80)  NOT NULL DEFAULT '',

  -- 2. Personal details
  address              VARCHAR(400) NOT NULL,
  height               VARCHAR(20)  NOT NULL DEFAULT '',
  occupation           VARCHAR(100) NOT NULL DEFAULT '',
  instagram            VARCHAR(100) NOT NULL DEFAULT '',
  facebook             VARCHAR(200) NOT NULL DEFAULT '',
  experience           VARCHAR(12)  NOT NULL DEFAULT '',
  experience_details   TEXT         NULL,

  -- 3. Photographs & documents (photo is public for the ID card; the rest are private files)
  photo                VARCHAR(200) NOT NULL DEFAULT '',
  photo_full           VARCHAR(200) NOT NULL DEFAULT '',
  id_proof             VARCHAR(200) NOT NULL DEFAULT '',

  -- 4. Pageant information
  why_participate      TEXT         NULL,
  strengths            TEXT         NULL,
  media_experience     VARCHAR(3)   NOT NULL DEFAULT '',
  comfortable_grooming VARCHAR(3)   NOT NULL DEFAULT '',

  -- 5. Registration / payment
  fee_acknowledged     TINYINT(1)   NOT NULL DEFAULT 0,
  payment_ref          VARCHAR(100) NOT NULL DEFAULT '',
  payment_proof        VARCHAR(200) NOT NULL DEFAULT '',

  -- 8. Parent / guardian consent (below 18)
  guardian_name        VARCHAR(100) NOT NULL DEFAULT '',
  guardian_relation    VARCHAR(40)  NOT NULL DEFAULT '',
  guardian_phone       VARCHAR(10)  NOT NULL DEFAULT '',
  guardian_consent     TINYINT(1)   NOT NULL DEFAULT 0,

  -- Admin
  status               VARCHAR(12)  NOT NULL DEFAULT 'pending',
  award                VARCHAR(40)  NOT NULL DEFAULT 'Participation',
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_reg_phone (phone),
  INDEX idx_reg_email (email),
  INDEX idx_reg_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enquiries (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  phone       CHAR(10)     NOT NULL,
  city        VARCHAR(80)  NOT NULL DEFAULT '',
  topic       VARCHAR(80)  NOT NULL,
  interest    VARCHAR(40)  NOT NULL DEFAULT '',
  source      VARCHAR(40)  NOT NULL DEFAULT 'website',
  status      VARCHAR(12)  NOT NULL DEFAULT 'new',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_enq_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id      VARCHAR(20)  UNIQUE,
  name         VARCHAR(100) NOT NULL,
  designation  VARCHAR(80)  NOT NULL,
  department   VARCHAR(80)  NOT NULL DEFAULT '',
  phone        VARCHAR(10)  NOT NULL DEFAULT '',
  blood_group  VARCHAR(5)   NOT NULL DEFAULT '',
  valid_till   DATE         NULL,
  photo        VARCHAR(200) NOT NULL DEFAULT '',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
  id           CHAR(36)     PRIMARY KEY,
  slug         VARCHAR(160) NOT NULL UNIQUE,
  title        VARCHAR(200) NOT NULL,
  excerpt      VARCHAR(400) NOT NULL DEFAULT '',
  type         VARCHAR(10)  NOT NULL DEFAULT 'blog',
  category     VARCHAR(60)  NOT NULL DEFAULT 'News',
  cover_image  VARCHAR(1000) NOT NULL DEFAULT '',
  status       VARCHAR(10)  NOT NULL DEFAULT 'published',
  blocks       JSON         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posts_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
