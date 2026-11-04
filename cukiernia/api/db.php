<?php

declare(strict_types=1);

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function database(): PDO
{
    static $connection;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $configPath = __DIR__ . '/config.local.php';

    if (!is_file($configPath)) {
        throw new RuntimeException('Skopiuj api/config.local.php.example do api/config.local.php.');
    }

    $config = require $configPath;
    $host = $config['host'] ?? '127.0.0.1';
    $port = (int) ($config['port'] ?? 3306);
    $name = $config['database'] ?? 'okruszyna';
    $username = $config['username'] ?? 'root';
    $password = $config['password'] ?? '';

    $connection = new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $connection->exec(
        'CREATE TABLE IF NOT EXISTS accounts (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(160) NOT NULL,
            email VARCHAR(254) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT \'customer\',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY accounts_email_unique (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    $connection->exec(
        'CREATE TABLE IF NOT EXISTS auth_tokens (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            account_id BIGINT UNSIGNED NOT NULL,
            token_hash CHAR(64) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY auth_tokens_hash_unique (token_hash),
            KEY auth_tokens_account_idx (account_id),
            CONSTRAINT auth_tokens_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    $connection->exec('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT \'customer\'');
    $connection->exec('ALTER TABLE orders ADD COLUMN IF NOT EXISTS account_id BIGINT UNSIGNED NULL');
    $connection->exec('ALTER TABLE orders ADD INDEX IF NOT EXISTS orders_account_id_idx (account_id)');

    return $connection;
}

function accountFromToken(PDO $db, string $token): ?array
{
    if (!preg_match('/^[A-Za-z0-9_-]{32,128}$/', $token)) {
        return null;
    }

    $query = $db->prepare(
        'SELECT accounts.id, accounts.name, accounts.email, accounts.role
         FROM auth_tokens
         JOIN accounts ON accounts.id = auth_tokens.account_id
         WHERE auth_tokens.token_hash = ?'
    );
    $query->execute([hash('sha256', $token)]);
    $account = $query->fetch();

    return $account ?: null;
}

function accountResponse(array $account): array
{
    return [
        'id' => (int) $account['id'],
        'name' => $account['name'],
        'email' => $account['email'],
        'role' => $account['role'] ?? 'customer',
    ];
}

function createAuthToken(PDO $db, int $accountId): string
{
    $token = bin2hex(random_bytes(32));
    $statement = $db->prepare(
        'INSERT INTO auth_tokens (account_id, token_hash) VALUES (?, ?)'
    );
    $statement->execute([$accountId, hash('sha256', $token)]);

    return $token;
}

function requestBody(): array
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);

    if ($length > 65536) {
        respond(['error' => 'Żądanie jest za duże.'], 413);
    }

    $raw = file_get_contents('php://input');

    try {
        $data = json_decode($raw ?: '', true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        respond(['error' => 'Nieprawidłowy format danych.'], 400);
    }

    if (!is_array($data)) {
        respond(['error' => 'Nieprawidłowy format danych.'], 400);
    }

    return $data;
}

function sessionId(): string
{
    $id = $_SERVER['HTTP_X_SESSION_ID'] ?? '';

    if (!preg_match('/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i', $id)) {
        respond(['error' => 'Nieprawidłowa sesja. Odśwież stronę i spróbuj ponownie.'], 400);
    }

    return strtolower($id);
}

function readProducts(PDO $db): array
{
    $rows = $db->query('SELECT * FROM products ORDER BY id')->fetchAll();

    return array_map(
        static fn (array $row): array => [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'cat' => $row['category'],
            'tag' => $row['tag'],
            'size' => $row['size'],
            'price' => (float) $row['price'],
            'col' => $row['decoration_color'],
            'e' => $row['emoji'],
            'c' => json_decode($row['colors'], true, 512, JSON_THROW_ON_ERROR),
            'desc' => $row['description'],
            'ing' => $row['ingredients'],
            'al' => json_decode($row['allergens'], true, 512, JSON_THROW_ON_ERROR),
        ],
        $rows
    );
}

function readOrder(PDO $db, string $number, string $session, ?int $accountId = null): ?array
{
    $statement = $db->prepare('SELECT * FROM orders WHERE order_number = ?');
    $statement->execute([$number]);
    $row = $statement->fetch();

    if (!$row) {
        return null;
    }

    $items = $db->prepare(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ? ORDER BY id'
    );
    $items->execute([$row['id']]);

    return [
        'id' => $row['order_number'],
        'name' => $row['customer_name'],
        'email' => $row['customer_email'],
        'total' => (float) $row['total'],
        'st' => $row['status'],
        'pickupDate' => $row['pickup_date'],
        't' => substr((string) $row['pickup_time'], 0, 5),
        'mine' => $row['session_id'] === $session || ($accountId !== null && (int) $row['account_id'] === $accountId),
        'note' => $row['note'],
        'why' => $row['cancellation_reason'],
        'items' => array_map(
            static fn (array $item): array => [(int) $item['product_id'], (int) $item['quantity']],
            $items->fetchAll()
        ),
    ];
}

function readOrders(PDO $db, string $session, ?int $accountId = null, string $accountRole = 'customer'): array
{
    $numbers = $db->query(
        'SELECT order_number FROM orders ORDER BY pickup_date, pickup_time, id'
    )->fetchAll(PDO::FETCH_COLUMN);

    $orders = array_values(array_filter(
        array_map(
            static fn (string $number): ?array => readOrder($db, $number, $session, $accountId),
            $numbers
        )
    ));

    return $accountRole === 'admin'
        ? $orders
        : array_values(array_filter($orders, static fn (array $order): bool => $order['mine']));
}

function validateProduct(array $data): array
{
    $textLimits = [
        'name' => 150,
        'cat' => 30,
        'tag' => 100,
        'size' => 100,
        'col' => 100,
        'e' => 20,
        'desc' => 5000,
        'ing' => 5000,
    ];
    $product = [];

    foreach ($textLimits as $field => $limit) {
        $value = trim((string) ($data[$field] ?? ''));

        if ($value === '' && in_array($field, ['tag', 'desc', 'ing'], true)) {
            $product[$field] = '';
            continue;
        }

        if ($value === '' || mb_strlen($value) > $limit) {
            respond(['error' => 'Uzupełnij wymagane pola produktu.'], 422);
        }

        $product[$field] = $value;
    }

    if (!in_array($product['cat'], ['Torty', 'Serniki', 'Tarty'], true)) {
        respond(['error' => 'Wybierz prawidłową kategorię produktu.'], 422);
    }

    $price = filter_var($data['price'] ?? null, FILTER_VALIDATE_FLOAT);

    if ($price === false || $price <= 0 || $price > 100000) {
        respond(['error' => 'Podaj prawidłową cenę produktu.'], 422);
    }

    $colors = $data['c'] ?? null;

    if (
        !is_array($colors)
        || count($colors) !== 2
        || array_filter($colors, static fn ($color): bool => !is_string($color) || !preg_match('/^#[0-9a-f]{6}$/i', $color))
    ) {
        respond(['error' => 'Nieprawidłowe kolory produktu.'], 422);
    }

    $allergens = $data['al'] ?? [];

    if (!is_array($allergens) || count($allergens) > 30) {
        respond(['error' => 'Nieprawidłowa lista alergenów.'], 422);
    }

    return [
        'name' => $product['name'],
        'category' => $product['cat'],
        'tag' => $product['tag'],
        'size' => $product['size'],
        'price' => round((float) $price, 2),
        'decoration_color' => $product['col'],
        'emoji' => $product['e'],
        'colors' => json_encode(array_values($colors), JSON_THROW_ON_ERROR),
        'description' => $product['desc'],
        'ingredients' => $product['ing'],
        'allergens' => json_encode(
            array_values(array_map(
                static fn ($item): string => mb_substr(trim((string) $item), 0, 100),
                $allergens
            )),
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        ),
    ];
}

function productIdFromData(PDO $db, mixed $id): int
{
    $productId = filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    if ($productId === false) {
        respond(['error' => 'Nieprawidłowy produkt.'], 422);
    }

    $statement = $db->prepare('SELECT 1 FROM products WHERE id = ?');
    $statement->execute([$productId]);

    if (!$statement->fetchColumn()) {
        respond(['error' => 'Wybrany produkt nie istnieje.'], 422);
    }

    return $productId;
}

function saveSession(PDO $db, string $session, array $data): void
{
    $cart = $data['cart'] ?? null;
    $favorites = $data['fav'] ?? null;

    if (!is_array($cart) || !is_array($favorites) || count($cart) > 100 || count($favorites) > 100) {
        respond(['error' => 'Nieprawidłowy koszyk lub lista ulubionych.'], 422);
    }

    $cleanCart = [];

    foreach ($cart as $item) {
        if (!is_array($item)) {
            respond(['error' => 'Nieprawidłowa pozycja w koszyku.'], 422);
        }

        $id = productIdFromData($db, $item['id'] ?? null);
        $quantity = filter_var($item['q'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 99]]);

        if ($quantity === false) {
            respond(['error' => 'Podaj prawidłową liczbę sztuk.'], 422);
        }

        $cleanCart[] = [
            'id' => $id,
            'q' => $quantity,
            'n' => mb_substr(trim((string) ($item['n'] ?? '')), 0, 30),
        ];
    }

    $cleanFavorites = array_values(array_unique(array_map(
        static fn ($id): int => productIdFromData($db, $id),
        $favorites
    )));

    $statement = $db->prepare(
        'INSERT INTO customer_sessions (session_id, cart, favorites) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cart = VALUES(cart), favorites = VALUES(favorites)'
    );
    $statement->execute([
        $session,
        json_encode($cleanCart, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        json_encode($cleanFavorites, JSON_THROW_ON_ERROR),
    ]);
}
