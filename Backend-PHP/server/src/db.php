<?php
// MySQL (PDO). On the first request it creates the tables if they don't exist yet
// (see schema.sql) and adds the two starter blog posts, like the Node backend did on startup.

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;

    $name = env('DB_NAME', 'miss_india');
    if (!preg_match('/^\w+$/', $name)) throw new RuntimeException('DB_NAME may only contain letters, numbers and _');

    $found = defined('Pdo\Mysql::ATTR_FOUND_ROWS') ? constant('Pdo\Mysql::ATTR_FOUND_ROWS') : PDO::MYSQL_ATTR_FOUND_ROWS;
    $init = defined('Pdo\Mysql::ATTR_INIT_COMMAND') ? constant('Pdo\Mysql::ATTR_INIT_COMMAND') : PDO::MYSQL_ATTR_INIT_COMMAND;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,  // real INT values in JSON, like mysql2
        PDO::ATTR_STRINGIFY_FETCHES => false,
        $found => true,                       // UPDATE reports matched rows, like mysql2
        // All timestamps are stored and read as UTC, so the API returns correct ISO dates.
        $init => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'",
    ];
    $host = env('DB_HOST', 'localhost');
    $port = (int) env('DB_PORT', '3306') ?: 3306;
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASSWORD', '');
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";

    try {
        $pdo = new PDO("$dsn;dbname=$name", $user, $pass, $options);
    } catch (PDOException $e) {
        // Unknown database → create it (works locally; on shared hosting the database already exists).
        if (strpos($e->getMessage(), '1049') === false) throw $e;
        $pdo = new PDO($dsn, $user, $pass, $options);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `$name`");
    }

    ensure_schema($pdo);
    return $pdo;
}

/** Runs schema.sql + seed once (and again whenever schema.sql changes). */
function ensure_schema(PDO $pdo): void
{
    $schemaFile = SERVER_DIR . '/schema.sql';
    $schema = (string) file_get_contents($schemaFile);
    $marker = DATA_DIR . '/schema.lock';
    $hash = md5($schema . '|' . env('DB_HOST') . '|' . env('DB_NAME', 'miss_india'));
    if (is_file($marker) && trim((string) file_get_contents($marker)) === $hash) return;

    $lock = fopen(DATA_DIR . '/schema.mutex', 'c');
    if ($lock) flock($lock, LOCK_EX);
    try {
        if (is_file($marker) && trim((string) file_get_contents($marker)) === $hash) return;
        foreach (preg_split('/;\s*$/m', $schema) as $stmt) {
            $stmt = trim($stmt);
            if ($stmt !== '') $pdo->exec($stmt);
        }
        $n = (int) $pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn();
        if ($n === 0) {
            $ins = $pdo->prepare(
                'INSERT INTO posts (id, slug, type, title, excerpt, category, cover_image, status, blocks, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            foreach (seed_posts() as $p) {
                $ins->execute([
                    $p['id'], $p['slug'], $p['type'] ?? 'blog', $p['title'], $p['excerpt'], $p['category'], $p['coverImage'],
                    $p['status'], json_encode($p['blocks'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    $p['createdAt'], $p['updatedAt'],
                ]);
            }
        }
        file_put_contents($marker, $hash);
    } finally {
        if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
    }
}

/** Runs a query and returns the rows. */
function query(string $sql, array $params = []): array
{
    $st = db()->prepare($sql);
    $st->execute(array_values($params));
    return $st->columnCount() ? $st->fetchAll() : [];
}

function one(string $sql, array $params = []): ?array
{
    $rows = query($sql, $params);
    return $rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE → affected rows. */
function execute(string $sql, array $params = []): int
{
    $st = db()->prepare($sql);
    $st->execute(array_values($params));
    return $st->rowCount();
}

/** "`a` = ?, `b` = ?" + values, for INSERT … SET / UPDATE … SET (keys come from our own code). */
function set_clause(array $data): array
{
    $cols = array_map(fn ($k) => "`$k` = ?", array_keys($data));
    return [implode(', ', $cols), array_values($data)];
}

function insert(string $table, array $data): int
{
    [$set, $values] = set_clause($data);
    execute("INSERT INTO `$table` SET $set", $values);
    return (int) db()->lastInsertId();
}

function update(string $table, array $data, $id): int
{
    [$set, $values] = set_clause($data);
    return execute("UPDATE `$table` SET $set WHERE id = ?", [...$values, $id]);
}
