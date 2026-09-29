<?php
// Small helpers that mirror the JavaScript behaviour of the original Express backend,
// so every field is cleaned, truncated and validated exactly the same way.

class HttpError extends Exception
{
    public int $status;

    public function __construct(string $message, int $status = 400)
    {
        parent::__construct($message);
        $this->status = $status;
    }
}

function bad_request(string $msg): HttpError
{
    return new HttpError($msg, 400);
}

/** JavaScript String(v ?? '') */
function js_string($v): string
{
    if ($v === null) return '';
    if (is_bool($v)) return $v ? 'true' : 'false';
    if (is_array($v)) return '';
    return (string) $v;
}

/** JavaScript truthiness ('' / 0 / null / false are falsy; '0' is truthy). */
function js_truthy($v): bool
{
    if ($v === null || $v === false || $v === '' || $v === 0 || $v === 0.0) return false;
    return true;
}

/** str(v, max): String(v ?? '').trim().slice(0, max) */
function str($v, int $max = 500): string
{
    $s = preg_replace('/^\s+|\s+$/u', '', js_string($v));
    if ($s === null) $s = trim(js_string($v));
    return mb_substr($s, 0, $max, 'UTF-8');
}

/** Only the digits, last 10 of them. */
function digits($v): string
{
    $d = preg_replace('/\D/', '', js_string($v));
    return strlen($d) > 10 ? substr($d, -10) : $d;
}

function is_email(string $v): bool
{
    return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $v);
}

function one_of($v, array $list): string
{
    return in_array($v, $list, true) ? $v : '';
}

/** Number(v) → positive integer or null (Number.isInteger(age) && age > 0). */
function positive_int_or_null($v): ?int
{
    if (is_bool($v)) $v = $v ? 1 : 0;
    if (is_string($v)) {
        $v = trim($v);
        if ($v === '' || !is_numeric($v)) return null;
        $v = +$v;
    }
    if (is_int($v)) return $v > 0 ? $v : null;
    if (is_float($v) && is_finite($v) && floor($v) == $v && $v > 0) return (int) $v;
    return null;
}

/** MySQL DATETIME (stored in UTC) → ISO string like JavaScript's toISOString(). */
function iso($d): ?string
{
    if (!$d) return null;
    $t = new DateTime($d, new DateTimeZone('UTC'));
    return $t->format('Y-m-d\TH:i:s.v\Z');
}

function uuid4(): string
{
    $d = random_bytes(16);
    $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
    $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}

function send_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
}

/** JavaScript `a || b` */
function js_or($a, $b)
{
    return js_truthy($a) ? $a : $b;
}
