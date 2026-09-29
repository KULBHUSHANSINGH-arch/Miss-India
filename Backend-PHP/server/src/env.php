<?php
// Loads server/.env (same keys as the Node backend: DB_HOST, DB_USER, ADMIN_PASSWORD, JWT_SECRET …).
// Real environment variables win over the file, like dotenv.

function load_env(string $file): void
{
    $GLOBALS['__ENV'] = [];
    if (!is_file($file)) return;
    foreach (preg_split('/\r?\n/', (string) file_get_contents($file)) as $line) {
        if (!preg_match('/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/', $line, $m)) continue;
        $v = $m[2];
        $q = $v[0] ?? '';
        if (($q === '"' || $q === "'") && strlen($v) > 1 && substr($v, -1) === $q) {
            $v = substr($v, 1, -1);
        } else {
            $v = preg_replace('/\s+#.*$/', '', $v); // inline comment
        }
        $GLOBALS['__ENV'][$m[1]] = $v;
    }
}

function env(string $key, string $default = ''): string
{
    $real = getenv($key);
    if ($real !== false && $real !== '') return $real;
    $v = $GLOBALS['__ENV'][$key] ?? '';
    return $v !== '' ? $v : $default;
}
