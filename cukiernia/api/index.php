<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    respond(['error' => 'Baza danych jest dostępna tylko na tym komputerze.'], 403);
}

$session = sessionId();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
$apiPosition = strpos($requestPath, '/api/');
$path = $apiPosition === false ? '' : substr($requestPath, $apiPosition + 5);
$path = preg_replace('#^index\.php/?#', '', $path);

try {
    $db = database();

    if ($method === 'GET' && $path === 'bootstrap') {
        $savedQuery = $db->prepare(
            'SELECT cart, favorites FROM customer_sessions WHERE session_id = ?'
        );
        $savedQuery->execute([$session]);
        $saved = $savedQuery->fetch();

        respond([
            'products' => readProducts($db),
            'orders' => readOrders($db, $session),
            'saved' => $saved
                ? [
                    'cart' => json_decode($saved['cart'], true, 512, JSON_THROW_ON_ERROR),
                    'fav' => json_decode($saved['favorites'], true, 512, JSON_THROW_ON_ERROR),
                ]
                : null,
        ]);
    }

    if ($method === 'PUT' && $path === 'saved') {
        saveSession($db, $session, requestBody());
        respond(['saved' => true]);
    }

    if ($method === 'POST' && $path === 'orders') {
        $data = requestBody();
        $name = trim((string) ($data['name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));
        $pickupDate = (string) ($data['pickupDate'] ?? '');
        $pickupTime = (string) ($data['pickupTime'] ?? '');
        $receipt = (string) ($data['receipt'] ?? '');
        $payment = (string) ($data['payment'] ?? '');

        if (
            $name === ''
            || mb_strlen($name) > 160
            || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || mb_strlen($email) > 254
            || mb_strlen($phone) > 30
            || !preg_match('/^[\d\s+()-]{9,30}$/', $phone)
            || preg_match_all('/\d/', $phone) < 9
            || !in_array($pickupDate, ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-10', '2026-11-11'], true)
            || !in_array($pickupTime, ['10:00', '11:00', '12:00', '13:00'], true)
            || !in_array($receipt, ['Paragon e-mailem', 'Faktura VAT'], true)
            || !in_array($payment, ['BLIK', 'Karta', 'Szybki przelew'], true)
            || ($data['termsAccepted'] ?? false) !== true
        ) {
            respond(['error' => 'Sprawdź dane kontaktowe, odbiór i wymagane zgody.'], 422);
        }

        $db->beginTransaction();

        $savedQuery = $db->prepare(
            'SELECT cart, favorites FROM customer_sessions WHERE session_id = ? FOR UPDATE'
        );
        $savedQuery->execute([$session]);
        $saved = $savedQuery->fetch();
        $cart = $saved ? json_decode($saved['cart'], true, 512, JSON_THROW_ON_ERROR) : [];

        if (!$cart) {
            $db->rollBack();
            respond(['error' => 'Koszyk jest pusty. Dodaj produkt i spróbuj ponownie.'], 409);
        }

        $items = [];
        $subtotalCents = 0;

        foreach ($cart as $item) {
            $productId = productIdFromData($db, $item['id'] ?? null);
            $quantity = filter_var($item['q'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 99]]);

            if ($quantity === false) {
                $db->rollBack();
                respond(['error' => 'Nieprawidłowa liczba sztuk w koszyku.'], 422);
            }

            $productQuery = $db->prepare('SELECT name, price FROM products WHERE id = ? FOR UPDATE');
            $productQuery->execute([$productId]);
            $product = $productQuery->fetch();
            $unitPrice = (float) $product['price'];
            $subtotalCents += (int) round($unitPrice * 100) * $quantity;
            $items[] = [
                'id' => $productId,
                'name' => $product['name'],
                'price' => $unitPrice,
                'quantity' => $quantity,
                'message' => mb_substr(trim((string) ($item['n'] ?? '')), 0, 30),
            ];
        }

        $discountCents = ($data['coupon'] ?? false) === true
            ? (int) round($subtotalCents * 0.1)
            : 0;
        $total = number_format(($subtotalCents - $discountCents) / 100, 2, '.', '');
        $note = current(array_filter(array_column($items, 'message'))) ?: null;
        $temporaryNumber = 'PENDING-' . bin2hex(random_bytes(8));

        $insertOrder = $db->prepare(
            'INSERT INTO orders
              (order_number, session_id, customer_name, customer_email, customer_phone,
               pickup_date, pickup_time, receipt_method, payment_method, status, total, note, consent_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $insertOrder->execute([
            $temporaryNumber,
            $session,
            $name,
            $email,
            $phone,
            $pickupDate,
            $pickupTime,
            $receipt,
            $payment,
            'Opłacone',
            $total,
            $note,
        ]);

        $orderId = (int) $db->lastInsertId();
        $orderNumber = sprintf('OK-%04d', $orderId);
        $updateNumber = $db->prepare('UPDATE orders SET order_number = ? WHERE order_number = ?');
        $updateNumber->execute([$orderNumber, $temporaryNumber]);

        $insertItem = $db->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, cake_message)
             VALUES (?, ?, ?, ?, ?, ?)'
        );

        foreach ($items as $item) {
            $insertItem->execute([
                $orderId,
                $item['id'],
                $item['name'],
                $item['price'],
                $item['quantity'],
                $item['message'] ?: null,
            ]);
        }

        $clearCart = $db->prepare('UPDATE customer_sessions SET cart = ? WHERE session_id = ?');
        $clearCart->execute(['[]', $session]);
        $db->commit();

        $order = readOrder($db, $orderNumber, $session);
        respond(['order' => $order], 201);
    }

    if ($method === 'POST' && $path === 'products') {
        $product = validateProduct(requestBody());
        $statement = $db->prepare(
            'INSERT INTO products
              (name, category, tag, size, price, decoration_color, emoji, colors, description, ingredients, allergens)
             VALUES
              (:name, :category, :tag, :size, :price, :decoration_color, :emoji, :colors, :description, :ingredients, :allergens)'
        );
        $statement->execute($product);
        $products = readProducts($db);
        $created = end($products);
        respond(['product' => $created], 201);
    }

    if ($method === 'PUT' && preg_match('#^products/(\d+)$#', $path, $matches)) {
        $productId = productIdFromData($db, $matches[1]);
        $product = validateProduct(requestBody());
        $product['id'] = $productId;
        $statement = $db->prepare(
            'UPDATE products SET
              name = :name, category = :category, tag = :tag, size = :size, price = :price,
              decoration_color = :decoration_color, emoji = :emoji, colors = :colors,
              description = :description, ingredients = :ingredients, allergens = :allergens
             WHERE id = :id'
        );
        $statement->execute($product);
        $updated = array_values(array_filter(
            readProducts($db),
            static fn (array $item): bool => $item['id'] === $productId
        ))[0];
        respond(['product' => $updated]);
    }

    if ($method === 'PUT' && preg_match('#^orders/([^/]+)/status$#', $path, $matches)) {
        $data = requestBody();
        $status = (string) ($data['status'] ?? '');

        if (!in_array($status, ['Przyjęte', 'Opłacone', 'W przygotowaniu', 'Gotowe do odbioru', 'Odebrane'], true)) {
            respond(['error' => 'Nieprawidłowy status zamówienia.'], 422);
        }

        $statement = $db->prepare('UPDATE orders SET status = ? WHERE order_number = ?');
        $statement->execute([$status, $matches[1]]);
        $order = readOrder($db, $matches[1], $session);

        if (!$order) {
            respond(['error' => 'Nie znaleziono zamówienia.'], 404);
        }

        respond(['order' => $order]);
    }

    if ($method === 'POST' && preg_match('#^orders/([^/]+)/cancel$#', $path, $matches)) {
        $reason = trim((string) (requestBody()['reason'] ?? ''));

        if (mb_strlen($reason) < 5 || mb_strlen($reason) > 500) {
            respond(['error' => 'Podaj powód anulowania (od 5 do 500 znaków).'], 422);
        }

        $statement = $db->prepare(
            "UPDATE orders SET status = 'Anulowane', cancellation_reason = ? WHERE order_number = ?"
        );
        $statement->execute([$reason, $matches[1]]);
        $order = readOrder($db, $matches[1], $session);

        if (!$order) {
            respond(['error' => 'Nie znaleziono zamówienia.'], 404);
        }

        respond(['order' => $order]);
    }

    respond(['error' => 'Nie znaleziono żądanej funkcji API.'], 404);
} catch (Throwable $error) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }

    error_log((string) $error);
    respond(['error' => 'Nie udało się wykonać operacji na MariaDB. Sprawdź konfigurację i log Apache.'], 500);
}
