<?php
// Every API route of the original Express backend (Backend/index.js), same URLs,
// same request fields, same response keys and the same error messages.

const CATEGORIES = ['Miss India', 'Mrs. India', 'Mr. India'];
const GENDERS = ['Male', 'Female', 'Other'];
const STATUSES = ['pending', 'confirmed', 'rejected'];
const AWARDS = ['Participation', 'Winner', '1st Runner-Up', '2nd Runner-Up', 'Special Award'];

// Kept in sync with Frontend/src/data/event.js (ENQUIRY_TOPICS / ENQUIRY_INTERESTS).
const ENQUIRY_TOPICS = [
    'Registration process & fee', 'Eligibility & age criteria', 'Audition & grooming dates',
    'Venue, stay & travel', 'Winner prizes & benefits', 'Sponsorship / partnership',
    'Creator / media collaboration', 'Please call me back',
];
const ENQUIRY_INTERESTS = ['Miss India', 'Mrs. India', 'Mr. India', 'Just exploring'];

/* ---------- request body ---------- */

/** JSON body (like express.json): {} when the request has no JSON. */
function json_body(): array
{
    static $body = null;
    if ($body !== null) return $body;
    $body = [];
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) return $body;
    $raw = (string) file_get_contents('php://input');
    if (strlen($raw) > 2 * 1024 * 1024) throw new HttpError('request entity too large', 413);
    if (trim($raw) === '') return $body;
    $data = json_decode($raw, true);
    if (!is_array($data)) throw bad_request('Invalid JSON in request body');
    return $body = $data;
}

function query_param(string $key): string
{
    $v = $_GET[$key] ?? '';
    return is_string($v) ? $v : '';
}

/* ---------- row mappers (snake_case DB → camelCase API) ---------- */

function to_registration(array $r): array
{
    return [
        'id' => $r['id'],
        'regId' => $r['reg_id'],
        'category' => $r['category'],
        'fullName' => $r['full_name'],
        'dob' => js_or($r['dob'], ''),
        'age' => $r['age'] ?? '',
        'gender' => $r['gender'],
        'phone' => $r['phone'],
        'whatsapp' => $r['whatsapp'],
        'email' => $r['email'],
        'city' => $r['city'],
        'state' => $r['state'],
        'address' => $r['address'],
        'height' => $r['height'],
        'occupation' => $r['occupation'],
        'instagram' => $r['instagram'],
        'facebook' => $r['facebook'],
        'experience' => $r['experience'],
        'experienceDetails' => js_or($r['experience_details'], ''),
        'photo' => $r['photo'],
        'photoFull' => $r['photo_full'],
        'idProof' => $r['id_proof'],
        'whyParticipate' => js_or($r['why_participate'], ''),
        'strengths' => js_or($r['strengths'], ''),
        'mediaExperience' => $r['media_experience'],
        'comfortableGrooming' => $r['comfortable_grooming'],
        'feeAcknowledged' => (bool) $r['fee_acknowledged'],
        'paymentRef' => $r['payment_ref'],
        'paymentProof' => $r['payment_proof'],
        'guardianName' => $r['guardian_name'],
        'guardianRelation' => $r['guardian_relation'],
        'guardianPhone' => $r['guardian_phone'],
        'guardianConsent' => (bool) $r['guardian_consent'],
        'status' => $r['status'],
        'award' => $r['award'],
        'createdAt' => iso($r['created_at']),
        'updatedAt' => iso($r['updated_at']),
    ];
}

// What an ID card needs. "Fully filled" = none of these are empty.
const CARD_FIELDS = [
    ['fullName', 'Full name'], ['phone', 'Mobile number'], ['email', 'Email'], ['address', 'Address'],
    ['category', 'Category'], ['gender', 'Gender'], ['dob', 'Date of birth'],
    ['city', 'City'], ['state', 'State'], ['photo', 'Close-up photograph'],
];

function missing_for_card(array $reg): array
{
    $out = [];
    foreach (CARD_FIELDS as [$k, $label]) {
        if (!js_truthy($reg[$k] ?? null)) $out[] = ['key' => $k, 'label' => $label];
    }
    return $out;
}

// What the public (the contestant themself) gets back from a lookup.
function public_view(array $reg): array
{
    return [
        'regId' => $reg['regId'],
        'fullName' => $reg['fullName'],
        'category' => $reg['category'],
        'gender' => $reg['gender'],
        'dob' => $reg['dob'],
        'age' => $reg['age'],
        'city' => $reg['city'],
        'state' => $reg['state'],
        'phone' => $reg['phone'],
        'email' => $reg['email'],
        'photo' => $reg['photo'],
        'status' => $reg['status'],
        'award' => $reg['award'],
        'createdAt' => $reg['createdAt'],
        'missing' => missing_for_card($reg),
    ];
}

function with_missing(array $reg): array
{
    return $reg + ['missing' => missing_for_card($reg)];
}

function to_team(array $m): array
{
    return [
        'id' => $m['id'],
        'teamId' => $m['team_id'],
        'name' => $m['name'],
        'designation' => $m['designation'],
        'department' => $m['department'],
        'phone' => $m['phone'],
        'bloodGroup' => $m['blood_group'],
        'validTill' => js_or($m['valid_till'], ''),
        'photo' => $m['photo'],
        'createdAt' => iso($m['created_at']),
    ];
}

function to_enquiry(array $e): array
{
    $createdAt = iso($e['created_at']);
    unset($e['created_at']);
    return $e + ['createdAt' => $createdAt];
}

function to_post(array $p, bool $withBlocks = true): array
{
    $out = [
        'id' => $p['id'],
        'slug' => $p['slug'],
        'type' => $p['type'],
        'title' => $p['title'],
        'excerpt' => $p['excerpt'],
        'category' => $p['category'],
        'coverImage' => $p['cover_image'],
        'status' => $p['status'],
    ];
    if ($withBlocks) $out['blocks'] = is_string($p['blocks']) ? json_decode($p['blocks'], true) : $p['blocks'];
    $out['createdAt'] = iso($p['created_at']);
    $out['updatedAt'] = iso($p['updated_at']);
    return $out;
}

/* ---------- blog helpers ---------- */

function slugify($text): string
{
    $s = mb_strtolower(str($text, 120), 'UTF-8');
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = preg_replace('/^-+|-+$/', '', $s);
    return $s !== '' ? $s : 'post';
}

function unique_slug($title, string $ignoreId = ''): string
{
    $base = slugify($title);
    $slug = $base;
    $n = 2;
    while (one('SELECT id FROM posts WHERE slug = ? AND id <> ?', [$slug, $ignoreId])) $slug = $base . '-' . $n++;
    return $slug;
}

// Media URLs may only point at our own uploads/images or an https link (e.g. YouTube).
function safe_url($u): string
{
    $url = str($u, 1000);
    return preg_match('#^(/uploads/|/images/|https://)#', $url) ? $url : '';
}

const BLOCK_TYPES = ['heading', 'paragraph', 'image', 'video', 'quote'];

function clean_blocks($blocks): array
{
    if (!is_array($blocks) || !array_is_list($blocks)) return [];
    $out = [];
    foreach ($blocks as $b) {
        if (!is_array($b) || !in_array($b['type'] ?? null, BLOCK_TYPES, true)) continue;
        if (count($out) >= 200) break;
        switch ($b['type']) {
            case 'heading':
                $c = ['type' => 'heading', 'level' => ($b['level'] ?? null) === 3 ? 3 : 2, 'text' => str($b['text'] ?? null, 200)];
                break;
            case 'paragraph':
                $c = ['type' => 'paragraph', 'text' => str($b['text'] ?? null, 20000)];
                break;
            case 'quote':
                $c = ['type' => 'quote', 'text' => str($b['text'] ?? null, 2000), 'author' => str($b['author'] ?? null, 120)];
                break;
            default:
                $c = ['type' => $b['type'], 'url' => safe_url($b['url'] ?? null), 'caption' => str($b['caption'] ?? null, 300)];
        }
        $out[] = $c;
    }
    return array_values(array_filter(
        $out,
        fn ($b) => ($b['type'] === 'image' || $b['type'] === 'video') ? $b['url'] !== '' : $b['text'] !== ''
    ));
}

function post_input(array $body, string $existingId = ''): array
{
    $title = str($body['title'] ?? null, 200);
    if ($title === '') throw bad_request('Title is required');
    $slugSource = js_truthy($body['slug'] ?? null) ? $body['slug'] : $title;
    return [
        'title' => $title,
        'slug' => unique_slug($slugSource, $existingId),
        'type' => ($body['type'] ?? null) === 'news' ? 'news' : 'blog',
        'excerpt' => str($body['excerpt'] ?? null, 400),
        'category' => js_or(str($body['category'] ?? null, 60), 'News'),
        'cover_image' => safe_url($body['coverImage'] ?? null),
        'status' => ($body['status'] ?? null) === 'draft' ? 'draft' : 'published',
        'blocks' => json_encode(clean_blocks($body['blocks'] ?? null), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ];
}

/* ---------- registrations ---------- */

function registration_input(array $b): array
{
    $dob = $b['dob'] ?? null;
    return [
        'category' => one_of($b['category'] ?? null, CATEGORIES),
        'full_name' => str($b['fullName'] ?? null, 100),
        'dob' => is_string($dob) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob) ? $dob : null,
        'age' => positive_int_or_null($b['age'] ?? null),
        'gender' => one_of($b['gender'] ?? null, GENDERS),
        'phone' => digits($b['phone'] ?? null),
        'whatsapp' => digits($b['whatsapp'] ?? null),
        'email' => mb_strtolower(str($b['email'] ?? null, 120), 'UTF-8'),
        'city' => str($b['city'] ?? null, 80),
        'state' => str($b['state'] ?? null, 80),
        'address' => str($b['address'] ?? null, 400),
        'height' => str($b['height'] ?? null, 20),
        'occupation' => str($b['occupation'] ?? null, 100),
        'instagram' => str($b['instagram'] ?? null, 100),
        'facebook' => str($b['facebook'] ?? null, 200),
        'experience' => one_of($b['experience'] ?? null, ['Fresher', 'Experienced']),
        'experience_details' => str($b['experienceDetails'] ?? null, 2000),
        'why_participate' => str($b['whyParticipate'] ?? null, 2000),
        'strengths' => str($b['strengths'] ?? null, 2000),
        'media_experience' => one_of($b['mediaExperience'] ?? null, ['Yes', 'No']),
        'comfortable_grooming' => one_of($b['comfortableGrooming'] ?? null, ['Yes', 'No']),
        'fee_acknowledged' => ($b['feeAcknowledged'] ?? null) === 'true' ? 1 : 0,
        'payment_ref' => str($b['paymentRef'] ?? null, 100),
        'guardian_name' => str($b['guardianName'] ?? null, 100),
        'guardian_relation' => str($b['guardianRelation'] ?? null, 40),
        'guardian_phone' => digits($b['guardianPhone'] ?? null),
        'guardian_consent' => ($b['guardianConsent'] ?? null) === 'true' ? 1 : 0,
    ];
}

function registration_by_id($id): ?array
{
    $row = one('SELECT * FROM registrations WHERE id = ?', [$id]);
    return $row ? to_registration($row) : null;
}

// Finds a registration for the contestant: Registration ID or email, plus the mobile number.
function find_own(array $body): array
{
    $phone = digits($body['phone'] ?? null);
    $regId = mb_strtoupper(str($body['regId'] ?? null, 20), 'UTF-8');
    $email = mb_strtolower(str($body['email'] ?? null, 120), 'UTF-8');
    if (strlen($phone) !== 10 || ($regId === '' && $email === '')) {
        throw bad_request('Enter your mobile number with your Registration ID or email');
    }
    $row = $regId !== ''
        ? one('SELECT * FROM registrations WHERE reg_id = ? AND phone = ?', [$regId, $phone])
        : one('SELECT * FROM registrations WHERE email = ? AND phone = ? ORDER BY id DESC', [$email, $phone]);
    if (!$row) throw new HttpError('No registration found for these details. Please check and try again.', 404);
    $reg = to_registration($row);
    if ($reg['status'] === 'rejected') throw new HttpError('This registration is not active. Please contact the organizers.', 403);
    return $reg;
}

function registration_filter(): array
{
    $where = [];
    $params = [];
    $status = query_param('status');
    $category = query_param('category');
    if (in_array($status, STATUSES, true)) { $where[] = 'status = ?'; $params[] = $status; }
    if (in_array($category, CATEGORIES, true)) { $where[] = 'category = ?'; $params[] = $category; }
    $search = str(query_param('q'), 100);
    if ($search !== '') {
        $where[] = '(full_name LIKE ? OR reg_id LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)';
        array_push($params, ...array_fill(0, 5, "%$search%"));
    }
    return [$where ? 'WHERE ' . implode(' AND ', $where) : '', $params];
}

const CSV_COLUMNS = [
    ['regId', 'Registration ID'], ['category', 'Category'], ['fullName', 'Full Name'], ['phone', 'Mobile'],
    ['whatsapp', 'WhatsApp'], ['email', 'Email'], ['dob', 'Date of Birth'], ['age', 'Age'], ['gender', 'Gender'],
    ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['height', 'Height'], ['occupation', 'Occupation'],
    ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['experience', 'Experience'],
    ['experienceDetails', 'Experience Details'], ['whyParticipate', 'Why Participate'], ['strengths', 'Strengths'],
    ['mediaExperience', 'Media Experience'], ['comfortableGrooming', 'Comfortable with Grooming'],
    ['paymentRef', 'Payment Reference'], ['guardianName', 'Guardian Name'], ['guardianRelation', 'Guardian Relation'],
    ['guardianPhone', 'Guardian Mobile'], ['status', 'Status'], ['award', 'Award'], ['createdAt', 'Registered At'],
];

function team_input(array $body): array
{
    $name = str($body['name'] ?? null, 100);
    $designation = str($body['designation'] ?? null, 80);
    if ($name === '' || $designation === '') throw bad_request('Name and designation are required');
    $validTill = $body['validTill'] ?? null;
    return [
        'name' => $name,
        'designation' => $designation,
        'department' => str($body['department'] ?? null, 80),
        'phone' => digits($body['phone'] ?? null),
        'blood_group' => str($body['bloodGroup'] ?? null, 5),
        'valid_till' => is_string($validTill) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $validTill) ? $validTill : '2026-12-31',
    ];
}

/* ====================================================================== */
/*  Routes                                                                */
/* ====================================================================== */

function register_routes(Router $r): void
{
    /* ---------- public: auth ---------- */

    $r->get('/api/health', fn () => send_json(['ok' => true, 'app' => 'miss-india-backend', 'pid' => getmypid()]));

    $r->post('/api/auth/login', fn () => login(json_body()));

    $r->get('/api/auth/me', function () {
        $admin = require_admin();
        send_json(['username' => $admin['sub'] ?? '']);
    });

    /* ---------- public: blog ---------- */

    $r->get('/api/posts', function () {
        $n = is_numeric(query_param('limit')) ? (int) query_param('limit') : 0;
        $limit = min($n ?: 50, 100);
        $params = [];
        $where = "status = 'published'";
        if (js_truthy(query_param('category'))) { $where .= ' AND category = ?'; $params[] = str(query_param('category'), 60); }
        if (in_array(query_param('type'), ['blog', 'news'], true)) { $where .= ' AND type = ?'; $params[] = query_param('type'); }
        $params[] = $limit;
        $rows = query("SELECT * FROM posts WHERE $where ORDER BY created_at DESC LIMIT ?", $params);
        send_json(array_map(fn ($p) => to_post($p, false), $rows));
    });

    $r->get('/api/posts/:slug', function ($p) {
        $post = one("SELECT * FROM posts WHERE slug = ? AND status = 'published'", [$p['slug']]);
        if (!$post) return send_json(['error' => 'Post not found'], 404);
        send_json(to_post($post));
    });

    /* ---------- public: registrations ---------- */

    $r->post('/api/registrations', function () {
        [$body, $files] = multipart_request();
        $f = registration_upload($files);
        $reg = registration_input($body);
        $errors = [];
        // Only these four are mandatory — everything else is optional.
        if ($reg['full_name'] === '') $errors[] = 'Full name is required';
        if (strlen($reg['phone']) !== 10) $errors[] = 'Enter a valid 10-digit mobile number';
        if (!is_email($reg['email'])) $errors[] = 'Enter a valid email address';
        if (mb_strlen($reg['address'], 'UTF-8') < 5) $errors[] = 'Full address is required';
        if ($reg['age'] !== null && ($reg['age'] < 15 || $reg['age'] > 45)) $errors[] = 'Age must be between 15 and 45 years';
        if (($body['agree'] ?? null) !== 'true') $errors[] = 'Please accept the declaration and terms';

        if (!$errors) {
            $dup = one('SELECT id FROM registrations WHERE phone = ? AND category = ? AND status <> ?', [$reg['phone'], $reg['category'], 'rejected']);
            if ($dup) {
                $errors[] = 'This mobile number is already registered' . (js_truthy($reg['category']) ? " for {$reg['category']}" : '')
                    . '. Use "Find my registration" on the ID Card page.';
            }
        }
        if ($errors) {
            discard_files();
            return send_json(['error' => $errors[0], 'errors' => $errors], 400);
        }

        $reg['photo'] = public_url($f['photo'] ?? null);
        $reg['photo_full'] = $f['photoFull']['filename'] ?? '';
        $reg['id_proof'] = $f['idProof']['filename'] ?? '';
        $reg['payment_proof'] = $f['paymentProof']['filename'] ?? '';

        $id = insert('registrations', $reg);
        $regId = 'MI26-' . str_pad((string) $id, 4, '0', STR_PAD_LEFT);
        execute('UPDATE registrations SET reg_id = ? WHERE id = ?', [$regId, $id]);

        send_json(public_view(registration_by_id($id)), 201);
    });

    $r->post('/api/registrations/lookup', fn () => send_json(public_view(find_own(json_body()))));

    // Lets a contestant fill in the details their ID card still needs. Only empty fields are filled.
    $r->post('/api/registrations/complete', function () {
        [$body, $files] = multipart_request();
        $file = photo_upload($files, 'photo');
        try {
            $reg = find_own($body);
        } catch (Throwable $err) {
            discard_files();
            throw $err;
        }
        $input = registration_input(['fullName' => '', 'phone' => '', 'email' => '', 'address' => ''] + $body);
        $updates = [];
        // These keys are named the same in the DB row and the API object.
        foreach (['category', 'gender', 'dob', 'age', 'city', 'state'] as $key) {
            if (!js_truthy($reg[$key]) && js_truthy($input[$key])) $updates[$key] = $input[$key];
        }
        $address = str($body['address'] ?? null, 400);
        if (!js_truthy($reg['address']) && mb_strlen($address, 'UTF-8') >= 5) $updates['address'] = $address;
        if (!empty($updates['age']) && ($updates['age'] < 15 || $updates['age'] > 45)) {
            discard_files();
            throw bad_request('Age must be between 15 and 45 years');
        }
        if ($file) {
            if (js_truthy($reg['photo'])) remove_stored($reg['photo']);
            $updates['photo'] = public_url($file);
        }
        if ($updates) update('registrations', $updates, $reg['id']);
        send_json(public_view(registration_by_id($reg['id'])));
    });

    /* ---------- public: enquiries (select-only lead form) ---------- */

    $r->post('/api/enquiries', function () {
        $b = json_body();
        $enquiry = [
            'name' => str($b['name'] ?? null, 100),
            'phone' => digits($b['phone'] ?? null),
            'city' => str($b['city'] ?? null, 80),
            'topic' => one_of($b['topic'] ?? null, ENQUIRY_TOPICS),
            'interest' => one_of($b['interest'] ?? null, ENQUIRY_INTERESTS),
            'source' => js_or(str($b['source'] ?? null, 40), 'website'),
        ];
        if ($enquiry['name'] === '') throw bad_request('Please enter your name');
        if (strlen($enquiry['phone']) !== 10) throw bad_request('Enter a valid 10-digit mobile number');
        if ($enquiry['topic'] === '') throw bad_request('Please choose what you would like to know');
        $id = insert('enquiries', $enquiry);
        send_json(['id' => $id, 'ok' => true], 201);
    });

    /* ---------- admin (every /api/admin route needs a valid login token) ---------- */

    $r->get('/api/admin/stats', function () {
        $posts = one("SELECT COUNT(*) AS total, SUM(status = 'published') AS published, SUM(status = 'draft') AS drafts FROM posts");
        $regs = one("SELECT COUNT(*) AS total, SUM(status = 'pending') AS pending, SUM(status = 'confirmed') AS confirmed FROM registrations");
        $enq = one("SELECT COUNT(*) AS total, SUM(status = 'new') AS fresh FROM enquiries");
        $team = one('SELECT COUNT(*) AS total FROM team');
        $cats = query('SELECT category, COUNT(*) AS n FROM registrations GROUP BY category');
        $recent = query('SELECT * FROM registrations ORDER BY id DESC LIMIT 5');
        $byCategory = [];
        foreach (CATEGORIES as $c) {
            $n = 0;
            foreach ($cats as $x) if ($x['category'] === $c) $n = (int) $x['n'];
            $byCategory[$c] = $n;
        }
        send_json([
            'posts' => (int) $posts['total'], 'published' => (int) ($posts['published'] ?? 0), 'drafts' => (int) ($posts['drafts'] ?? 0),
            'registrations' => (int) $regs['total'], 'pending' => (int) ($regs['pending'] ?? 0), 'confirmed' => (int) ($regs['confirmed'] ?? 0),
            'enquiries' => (int) $enq['total'], 'newEnquiries' => (int) ($enq['fresh'] ?? 0),
            'team' => (int) $team['total'],
            'byCategory' => $byCategory,
            'recentRegistrations' => array_map('to_registration', $recent),
        ]);
    });

    // Blog posts
    $r->get('/api/admin/posts', function () {
        $rows = query('SELECT * FROM posts ORDER BY created_at DESC');
        send_json(array_map(fn ($p) => to_post($p, false), $rows));
    });

    $r->get('/api/admin/posts/:id', function ($p) {
        $post = one('SELECT * FROM posts WHERE id = ?', [$p['id']]);
        if (!$post) return send_json(['error' => 'Post not found'], 404);
        send_json(to_post($post));
    });

    $r->post('/api/admin/posts', function () {
        $id = uuid4();
        insert('posts', ['id' => $id] + post_input(json_body()));
        send_json(to_post(one('SELECT * FROM posts WHERE id = ?', [$id])), 201);
    });

    $r->put('/api/admin/posts/:id', function ($p) {
        $existing = one('SELECT id FROM posts WHERE id = ?', [$p['id']]);
        if (!$existing) return send_json(['error' => 'Post not found'], 404);
        update('posts', post_input(json_body(), $existing['id']), $existing['id']);
        send_json(to_post(one('SELECT * FROM posts WHERE id = ?', [$existing['id']])));
    });

    $r->delete('/api/admin/posts/:id', function ($p) {
        if (!execute('DELETE FROM posts WHERE id = ?', [$p['id']])) return send_json(['error' => 'Post not found'], 404);
        send_json(['ok' => true]);
    });

    $r->post('/api/admin/upload', function () {
        [, $files] = multipart_request();
        $file = media_upload($files, 'file');
        if (!$file) return send_json(['error' => 'No file received'], 400);
        send_json(['url' => public_url($file), 'kind' => is_video($file) ? 'video' : 'image'], 201);
    });

    // Registrations
    $r->get('/api/admin/registrations', function () {
        [$sql, $params] = registration_filter();
        $rows = query("SELECT * FROM registrations $sql ORDER BY id DESC", $params);
        send_json(array_map(fn ($row) => with_missing(to_registration($row)), $rows));
    });

    $r->get('/api/admin/registrations.csv', function () {
        [$sql, $params] = registration_filter();
        $rows = array_map('to_registration', query("SELECT * FROM registrations $sql ORDER BY id", $params));
        // Prefix formula-looking cells so spreadsheets never execute them.
        $cell = function ($v) {
            $s = js_string($v);
            if (preg_match('/^[=+\-@\t\r]/', $s)) $s = "'$s";
            return '"' . str_replace('"', '""', $s) . '"';
        };
        $lines = [implode(',', array_map(fn ($c) => $cell($c[1]), CSV_COLUMNS))];
        foreach ($rows as $row) $lines[] = implode(',', array_map(fn ($c) => $cell($row[$c[0]]), CSV_COLUMNS));
        http_response_code(200);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="registrations.csv"');
        echo "\u{FEFF}" . implode("\r\n", $lines);
    });

    $r->get('/api/admin/registrations/:id', function ($p) {
        $reg = registration_by_id($p['id']);
        if (!$reg) return send_json(['error' => 'Registration not found'], 404);
        send_json(with_missing($reg));
    });

    $r->patch('/api/admin/registrations/:id', function ($p) {
        $b = json_body();
        $updates = [];
        if (in_array($b['status'] ?? null, STATUSES, true)) $updates['status'] = $b['status'];
        if (in_array($b['award'] ?? null, AWARDS, true)) $updates['award'] = $b['award'];
        if (!$updates) throw bad_request('Nothing to update');
        if (!update('registrations', $updates, $p['id'])) return send_json(['error' => 'Registration not found'], 404);
        send_json(with_missing(registration_by_id($p['id'])));
    });

    $r->delete('/api/admin/registrations/:id', function ($p) {
        $row = one('SELECT photo, photo_full, id_proof, payment_proof FROM registrations WHERE id = ?', [$p['id']]);
        if (!$row) return send_json(['error' => 'Registration not found'], 404);
        execute('DELETE FROM registrations WHERE id = ?', [$p['id']]);
        foreach ($row as $v) remove_stored($v);
        send_json(['ok' => true]);
    });

    // Private documents (ID proof, payment proof, full-length photo) — admins only.
    $r->get('/api/admin/files/:name', function ($p) {
        $name = basename(str_replace('\\', '/', $p['name']));
        $file = PRIVATE_DIR . '/' . $name;
        if ($name === '' || $name[0] === '.' || !is_file($file)) return send_json(['error' => 'File not found'], 404);
        $types = array_flip(ALL_TYPES);
        $ext = '.' . strtolower(pathinfo($name, PATHINFO_EXTENSION));
        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($file));
        header('X-Content-Type-Options: nosniff');
        readfile($file);
    });

    // Enquiries
    $r->get('/api/admin/enquiries', function () {
        $status = in_array(query_param('status'), ['new', 'contacted'], true) ? query_param('status') : '';
        $rows = $status
            ? query('SELECT * FROM enquiries WHERE status = ? ORDER BY id DESC', [$status])
            : query('SELECT * FROM enquiries ORDER BY id DESC');
        send_json(array_map('to_enquiry', $rows));
    });

    $r->patch('/api/admin/enquiries/:id', function ($p) {
        $status = json_body()['status'] ?? null;
        if (!in_array($status, ['new', 'contacted'], true)) throw bad_request('Invalid status');
        execute('UPDATE enquiries SET status = ? WHERE id = ?', [$status, $p['id']]);
        $row = one('SELECT * FROM enquiries WHERE id = ?', [$p['id']]);
        if (!$row) throw new RuntimeException('Enquiry not found');
        send_json(to_enquiry($row));
    });

    $r->delete('/api/admin/enquiries/:id', function ($p) {
        execute('DELETE FROM enquiries WHERE id = ?', [$p['id']]);
        send_json(['ok' => true]);
    });

    // Team members (for team ID cards)
    $r->get('/api/admin/team', function () {
        send_json(array_map('to_team', query('SELECT * FROM team ORDER BY id DESC')));
    });

    $r->post('/api/admin/team', function () {
        [$body, $files] = multipart_request();
        $file = photo_upload($files, 'photo');
        try { $input = team_input($body); } catch (Throwable $err) { discard_files(); throw $err; }
        $id = insert('team', $input + ['photo' => public_url($file)]);
        execute('UPDATE team SET team_id = ? WHERE id = ?', ['VJSF-T' . str_pad((string) $id, 3, '0', STR_PAD_LEFT), $id]);
        send_json(to_team(one('SELECT * FROM team WHERE id = ?', [$id])), 201);
    });

    $r->put('/api/admin/team/:id', function ($p) {
        [$body, $files] = multipart_request();
        $file = photo_upload($files, 'photo');
        $member = one('SELECT * FROM team WHERE id = ?', [$p['id']]);
        if (!$member) { discard_files(); return send_json(['error' => 'Member not found'], 404); }
        try { $input = team_input($body); } catch (Throwable $err) { discard_files(); throw $err; }
        if ($file) { remove_stored($member['photo']); $input['photo'] = public_url($file); }
        update('team', $input, $member['id']);
        send_json(to_team(one('SELECT * FROM team WHERE id = ?', [$member['id']])));
    });

    $r->delete('/api/admin/team/:id', function ($p) {
        $member = one('SELECT photo FROM team WHERE id = ?', [$p['id']]);
        execute('DELETE FROM team WHERE id = ?', [$p['id']]);
        if ($member) remove_stored($member['photo']);
        send_json(['ok' => true]);
    });
}
