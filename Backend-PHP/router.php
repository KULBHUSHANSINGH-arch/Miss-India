<?php
// LOCAL DEVELOPMENT ONLY — does what .htaccess does on Hostinger, for PHP's built-in server:
//   npm run dev   (= php -S localhost:6869 router.php)
// /api → server/index.php, /uploads → uploaded files, anything else → Frontend/dist (the built React app).
// While developing the frontend, run `npm run dev` in Frontend/ too; Vite proxies /api and /uploads here.

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');

if (preg_match('#^/api(/|$)#', $path)) {
    require __DIR__ . '/server/index.php';
    return true;
}

if (preg_match('#^/server(/|$)#', $path) || strpos($path, '..') !== false) {
    http_response_code(403);
    return true;
}

$types = [
    'html' => 'text/html; charset=utf-8', 'js' => 'text/javascript', 'css' => 'text/css', 'json' => 'application/json',
    'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp',
    'gif' => 'image/gif', 'ico' => 'image/x-icon', 'pdf' => 'application/pdf', 'mp4' => 'video/mp4', 'webm' => 'video/webm',
    'mov' => 'video/quicktime', 'woff' => 'font/woff', 'woff2' => 'font/woff2', 'txt' => 'text/plain',
];
$send = function (string $file) use ($types) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($file));
    readfile($file);
};

if (preg_match('#^/uploads/#', $path)) {
    $file = __DIR__ . $path;
    if (is_file($file) && !preg_match('/\.(php\d*|phtml|phar|htaccess)$/i', $file)) return $send($file) ?? true;
    http_response_code(404);
    echo 'Not found';
    return true;
}

$dist = dirname(__DIR__) . '/Frontend/dist';
$file = $dist . $path;
if ($path !== '/' && is_file($file)) return $send($file) ?? true;
if (is_file("$dist/index.html")) return $send("$dist/index.html") ?? true;

http_response_code(404);
echo 'Frontend not built yet — run "npm run build" in Frontend/ (or use "npm run dev" there).';
return true;
