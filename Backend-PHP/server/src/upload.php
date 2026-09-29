<?php
// File uploads — same rules as the Node (multer) backend:
//   public  → /uploads            (ID-card photos, team photos, blog media)
//   private → server/private_uploads (ID proofs, payment screenshots, full-length photos; admins only)

const IMAGE_TYPES = [
    'image/jpeg' => '.jpg',
    'image/png' => '.png',
    'image/webp' => '.webp',
    'image/gif' => '.gif',
];
const VIDEO_TYPES = [
    'video/mp4' => '.mp4',
    'video/webm' => '.webm',
    'video/quicktime' => '.mov',
];
const DOC_TYPES = IMAGE_TYPES + ['application/pdf' => '.pdf'];
const ALL_TYPES = DOC_TYPES + VIDEO_TYPES;

// Registration fields that must stay private.
const PRIVATE_FIELDS = ['photoFull', 'idProof', 'paymentProof'];

const FIVE_MB = 5 * 1024 * 1024;
const MEDIA_MAX = 200 * 1024 * 1024;

/** Files this request saved, so they can be removed when validation fails. */
$GLOBALS['__SAVED_FILES'] = [];

function ini_bytes(string $v): int
{
    $v = trim($v);
    if ($v === '') return 0;
    $n = (int) $v;
    switch (strtolower(substr($v, -1))) {
        case 'g': $n *= 1024;
        // no break
        case 'm': $n *= 1024;
        // no break
        case 'k': $n *= 1024;
    }
    return $n;
}

/**
 * Multipart body for PUT/PATCH (PHP only fills $_POST/$_FILES for POST).
 * Returns [fields, files] with $_FILES-style file entries.
 */
function parse_multipart_body(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!preg_match('/boundary=(?:"([^"]+)"|([^;]+))/i', $type, $m)) return [[], []];
    $boundary = $m[1] !== '' ? $m[1] : trim($m[2]);
    $raw = (string) file_get_contents('php://input');
    $fields = [];
    $files = [];
    foreach (explode("--$boundary", $raw) as $part) {
        if ($part === '' || strncmp($part, '--', 2) === 0) continue;
        $part = preg_replace('/^\r\n/', '', $part, 1);
        $split = strpos($part, "\r\n\r\n");
        if ($split === false) continue;
        $rawHeaders = substr($part, 0, $split);
        $content = substr($part, $split + 4);
        if (substr($content, -2) === "\r\n") $content = substr($content, 0, -2);
        $headers = [];
        foreach (explode("\r\n", $rawHeaders) as $h) {
            if (strpos($h, ':') !== false) {
                [$k, $v] = explode(':', $h, 2);
                $headers[strtolower(trim($k))] = trim($v);
            }
        }
        $disp = $headers['content-disposition'] ?? '';
        if (!preg_match('/\bname="([^"]*)"/i', $disp, $nm)) continue;
        $name = $nm[1];
        if (preg_match('/\bfilename="([^"]*)"/i', $disp, $fm)) {
            if ($fm[1] === '' && $content === '') {
                $files[$name] = ['name' => '', 'type' => '', 'tmp_name' => '', 'error' => UPLOAD_ERR_NO_FILE, 'size' => 0];
                continue;
            }
            $tmp = tempnam(sys_get_temp_dir(), 'mi');
            file_put_contents($tmp, $content);
            register_shutdown_function(fn () => is_file($tmp) && @unlink($tmp));
            $files[$name] = [
                'name' => $fm[1],
                'type' => $headers['content-type'] ?? 'application/octet-stream',
                'tmp_name' => $tmp,
                'error' => UPLOAD_ERR_OK,
                'size' => strlen($content),
            ];
        } else {
            $fields[$name] = $content;
        }
    }
    return [$fields, $files];
}

/** Request body + files for a multipart request (any method). */
function multipart_request(): array
{
    // The whole request was bigger than PHP's post_max_size → PHP dropped everything.
    $len = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    $postMax = ini_bytes((string) ini_get('post_max_size'));
    if ($postMax > 0 && $len > $postMax) throw bad_request('File is too large (max 5 MB)');

    if ($_SERVER['REQUEST_METHOD'] === 'POST') return [$_POST, $_FILES];
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') === 0) return parse_multipart_body();
    return [json_body(), []];
}

function kinds(array $allowed): string
{
    $exts = array_values(array_unique(array_values($allowed)));
    return str_replace('.', '', strtoupper(implode(', ', $exts)));
}

/**
 * Validates and saves the uploaded files.
 *   $fields: [fieldName => allowed mime map]
 * Returns [fieldName => ['filename' => …, 'path' => …, 'mimetype' => …]].
 */
function accept_uploads(array $files, array $fields, int $maxSize): array
{
    $ok = [];
    foreach ($files as $field => $f) {
        if (!isset($fields[$field]) || is_array($f['name'])) throw bad_request('Unexpected file field');
        if ($f['error'] === UPLOAD_ERR_NO_FILE) continue;
        if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE || $f['size'] > $maxSize) {
            throw bad_request('File is too large (max 5 MB)');
        }
        if ($f['error'] !== UPLOAD_ERR_OK) throw new HttpError('Upload failed', 500);
        $allowed = $fields[$field];
        if (!isset($allowed[$f['type']])) throw bad_request('Unsupported file type. Use ' . kinds($allowed) . '.');
        $ok[$field] = $f;
    }

    $saved = [];
    foreach ($ok as $field => $f) {
        $dir = in_array($field, PRIVATE_FIELDS, true) ? PRIVATE_DIR : UPLOAD_DIR;
        // Random names: never trust (or expose) the uploader's filename.
        $name = (int) floor(microtime(true) * 1000) . '-' . bin2hex(random_bytes(8)) . ALL_TYPES[$f['type']];
        $path = "$dir/$name";
        $moved = is_uploaded_file($f['tmp_name']) ? move_uploaded_file($f['tmp_name'], $path) : rename($f['tmp_name'], $path);
        if (!$moved) {
            discard_files();
            throw new HttpError('Could not save the uploaded file', 500);
        }
        @chmod($path, 0644);
        $GLOBALS['__SAVED_FILES'][] = $path;
        $saved[$field] = ['filename' => $name, 'path' => $path, 'mimetype' => $f['type']];
    }
    return $saved;
}

// Registration: close-up photo must be an image; documents may be image or PDF. 5 MB each.
function registration_upload(array $files): array
{
    return accept_uploads($files, [
        'photo' => IMAGE_TYPES,
        'photoFull' => DOC_TYPES,
        'idProof' => DOC_TYPES,
        'paymentProof' => DOC_TYPES,
    ], FIVE_MB);
}

// Team photos / profile completion: a single image, 5 MB.
function photo_upload(array $files, string $field): ?array
{
    return accept_uploads($files, [$field => IMAGE_TYPES], FIVE_MB)[$field] ?? null;
}

// Blog media: images or videos, 200 MB.
function media_upload(array $files, string $field): ?array
{
    return accept_uploads($files, [$field => IMAGE_TYPES + VIDEO_TYPES], MEDIA_MAX)[$field] ?? null;
}

function public_url(?array $file): string
{
    return $file ? '/uploads/' . $file['filename'] : '';
}

function is_video(array $file): bool
{
    return isset(VIDEO_TYPES[$file['mimetype']]);
}

/** Deletes files this request uploaded (used when validation fails). */
function discard_files(): void
{
    foreach ($GLOBALS['__SAVED_FILES'] as $p) @unlink($p);
    $GLOBALS['__SAVED_FILES'] = [];
}

/** Deletes a stored file given its DB value ('/uploads/x.jpg' or 'x.pdf' in the private dir). */
function remove_stored($value): void
{
    if (!$value) return;
    $name = basename(str_replace('\\', '/', (string) $value));
    $dir = strncmp((string) $value, '/uploads/', 9) === 0 ? UPLOAD_DIR : PRIVATE_DIR;
    if ($name !== '' && $name[0] !== '.') @unlink("$dir/$name");
}
