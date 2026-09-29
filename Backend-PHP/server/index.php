<?php
// Miss India 2026 — PHP backend (replacement for the Express backend in Backend/).
// Every request to /api/* is sent here by the .htaccess in the site root.

declare(strict_types=0);

define('SERVER_DIR', __DIR__);
define('DATA_DIR', __DIR__ . '/data');
// Public: served at /uploads (ID-card photos, blog media). Lives next to index.html.
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads');
// Private: ID proofs, payment screenshots, full-length photos — only admins can open these.
define('PRIVATE_DIR', __DIR__ . '/private_uploads');

// Never print PHP warnings into the JSON; log them to server/data/php-error.log instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL & ~E_DEPRECATED);

foreach ([DATA_DIR, UPLOAD_DIR, PRIVATE_DIR] as $dir) {
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
}
ini_set('error_log', DATA_DIR . '/php-error.log');
mb_internal_encoding('UTF-8');

require __DIR__ . '/src/helpers.php';
require __DIR__ . '/src/env.php';
require __DIR__ . '/src/db.php';
require __DIR__ . '/src/seed.php';
require __DIR__ . '/src/auth.php';
require __DIR__ . '/src/upload.php';
require __DIR__ . '/src/router.php';
require __DIR__ . '/src/routes.php';

load_env(__DIR__ . '/.env');

// CORS (same as app.use(cors()) in Express).
header('Access-Control-Allow-Origin: *');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE');
    if (!empty($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header('Access-Control-Allow-Headers: ' . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
        header('Vary: Access-Control-Request-Headers');
    }
    header('Content-Length: 0');
    http_response_code(204);
    exit;
}

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
// Keep percent-encoded path params (e.g. a slug) intact for the router: match on the raw path.
$rawPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

$router = new Router();
register_routes($router);

try {
    // Every /api/admin route needs a valid admin token (like admin.use(requireAdmin)).
    if (preg_match('#^/api/admin(/|$)#i', $path)) require_admin();
    if (!$router->dispatch($_SERVER['REQUEST_METHOD'], $rawPath)) {
        send_json(['error' => 'Not found'], 404);
    }
} catch (HttpError $e) {
    discard_files();
    send_json(['error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    discard_files();
    error_log((string) $e);
    // A table was dropped by hand → create the tables again on the next request.
    if ($e instanceof PDOException && $e->getCode() === '42S02') @unlink(DATA_DIR . '/schema.lock');
    if (!headers_sent()) send_json(['error' => 'Something went wrong'], 500);
}
