<?php
// Admin login with a signed token (JWT, HS256, 12 hours) — same as the Node backend.

const DEFAULT_ADMIN_PASSWORD = 'admin@2026';

function jwt_secret(): string
{
    $secret = env('JWT_SECRET');
    if ($secret !== '' && $secret !== 'replace-with-a-long-random-string') return $secret;
    // No secret in .env: keep a random one in data/ so logins survive between requests.
    $file = DATA_DIR . '/jwt_secret';
    if (!is_file($file)) {
        error_log('JWT_SECRET not set in server/.env — using a generated one.');
        file_put_contents($file, bin2hex(random_bytes(32)));
    }
    return trim((string) file_get_contents($file));
}

function admin_user(): string
{
    return env('ADMIN_USERNAME', 'admin');
}

function admin_pass(): string
{
    $p = env('ADMIN_PASSWORD');
    if ($p === '') {
        error_log('ADMIN_PASSWORD not set — using default "' . DEFAULT_ADMIN_PASSWORD . '". Set it in server/.env before going live.');
        return DEFAULT_ADMIN_PASSWORD;
    }
    return $p;
}

function b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64url_decode(string $s): string
{
    return (string) base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
}

function jwt_sign(array $payload, int $expiresIn): string
{
    $now = time();
    $payload += ['iat' => $now, 'exp' => $now + $expiresIn];
    $head = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body = b64url(json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    $sig = b64url(hash_hmac('sha256', "$head.$body", jwt_secret(), true));
    return "$head.$body.$sig";
}

function jwt_verify(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$head, $body, $sig] = $parts;
    $header = json_decode(b64url_decode($head), true);
    if (($header['alg'] ?? '') !== 'HS256') return null;
    $expected = b64url(hash_hmac('sha256', "$head.$body", jwt_secret(), true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(b64url_decode($body), true);
    if (!is_array($payload)) return null;
    if (isset($payload['exp']) && time() >= (int) $payload['exp']) return null;
    return $payload;
}

function safe_equal($a, $b): bool
{
    return hash_equals(hash('sha256', js_string($a)), hash('sha256', js_string($b)));
}

function login(array $body): void
{
    $username = $body['username'] ?? '';
    $password = $body['password'] ?? '';
    $ok = safe_equal($username, admin_user()) & safe_equal($password, admin_pass());
    if (!$ok) {
        send_json(['error' => 'Invalid username or password'], 401);
        return;
    }
    $token = jwt_sign(['sub' => admin_user(), 'role' => 'admin'], 12 * 3600);
    send_json(['token' => $token, 'username' => admin_user()]);
}

function bearer_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower($k) === 'authorization') $header = $v;
        }
    }
    return strncmp($header, 'Bearer ', 7) === 0 ? substr($header, 7) : '';
}

/** Returns the token payload or throws 401. */
function require_admin(): array
{
    $payload = jwt_verify(bearer_token());
    if (!$payload) throw new HttpError('Please log in again', 401);
    return $payload;
}
