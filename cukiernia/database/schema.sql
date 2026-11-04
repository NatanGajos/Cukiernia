SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS okruszyna
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE okruszyna;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(30) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  size VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  decoration_color VARCHAR(100) NOT NULL,
  emoji VARCHAR(20) NOT NULL,
  colors JSON NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  allergens JSON NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_sessions (
  session_id CHAR(36) NOT NULL,
  cart JSON NOT NULL,
  favorites JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(24) NULL,
  session_id CHAR(36) NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  receipt_method VARCHAR(40) NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  note VARCHAR(30) NULL,
  cancellation_reason VARCHAR(500) NULL,
  consent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_order_number_unique (order_number),
  KEY orders_pickup_date_idx (pickup_date, pickup_time),
  KEY orders_session_id_idx (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  cake_message VARCHAR(30) NULL,
  PRIMARY KEY (id),
  KEY order_items_order_id_idx (order_id),
  UNIQUE KEY order_items_order_product_unique (order_id, product_id),
  CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_fk FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO products
  (id, name, category, tag, size, price, decoration_color, emoji, colors, description, ingredients, allergens)
VALUES
  (1, 'Tort waniliowy z wiśnią', 'Torty', 'Na wyjątkowe chwile', '18 cm · 8–10 porcji', 180.00, 'kremowy z wiśnią', '🎂',
   '["#f3e4d0","#b5483f"]',
   'Puszysty biszkopt, krem z prawdziwą wanilią i kwaskowe wiśnie. Delikatny, nieprzesłodzony — gotowy, by świętować z Tobą.',
   'śmietanka 36%, mascarpone, jaja, mąka pszenna, wiśnie 18%, cukier, masło, mleko, wanilia, skrobia ziemniaczana, żelatyna.',
   '["gluten (pszenica)","jaja","mleko"]'),
  (2, 'Sernik baskijski', 'Serniki', 'Ulubieniec pracowni', '20 cm · 8 porcji', 120.00, 'karmelowy', '🍰',
   '["#e8c99a","#9a5b2e"]',
   'Kremowy środek i mocno przypieczona góra. Tak właśnie powinien smakować sernik.',
   'serek śmietankowy, śmietanka, jaja, cukier, mąka, wanilia.',
   '["gluten (pszenica)","jaja","mleko"]'),
  (3, 'Tort czekoladowy', 'Torty', 'Intensywnie czekoladowy', '18 cm · 8 porcji', 140.00, 'czekoladowy', '🍫',
   '["#9c6a4f","#3b2218"]',
   'Wilgotny biszkopt kakaowy i gęsty krem ganache z gorzkiej czekolady.',
   'czekolada gorzka, masło, jaja, cukier, mąka, kakao, śmietanka.',
   '["gluten (pszenica)","jaja","mleko"]'),
  (4, 'Tarta jabłkowa', 'Tarty', 'Smak jesieni', '24 cm · 8 porcji', 96.00, 'złoty', '🥧',
   '["#f0d7a8","#c98a3d"]',
   'Kruche ciasto, jabłka z cynamonem ułożone w różę.',
   'jabłka, mąka, masło, cukier, jaja, cynamon.',
   '["gluten (pszenica)","jaja","mleko"]');

INSERT IGNORE INTO orders
  (id, order_number, customer_name, customer_email, customer_phone, pickup_date, pickup_time, receipt_method, payment_method, status, total, note, cancellation_reason)
VALUES
  (1041, 'OK-1041', 'Jan Wiśniewski', 'jan@example.com', '', '2026-11-05', '10:00:00', 'Paragon e-mailem', 'BLIK', 'Opłacone', 216.00, NULL, NULL),
  (1043, 'OK-1043', 'Ewa Mazur', 'ewa@example.com', '', '2026-11-05', '13:00:00', 'Paragon e-mailem', 'Karta', 'W przygotowaniu', 140.00, NULL, NULL),
  (1045, 'OK-1045', 'Piotr Wójcik', 'piotr@example.com', '', '2026-11-06', '11:00:00', 'Paragon e-mailem', 'BLIK', 'Opłacone', 240.00, NULL, NULL),
  (1048, 'OK-1048', 'Anna Kowalska', 'anna@example.com', '', '2026-11-07', '12:00:00', 'Paragon e-mailem', 'BLIK', 'W przygotowaniu', 378.00, 'Sto lat!', NULL),
  (1050, 'OK-1050', 'Alicja Lis', 'alicja@example.com', '', '2026-11-07', '14:00:00', 'Paragon e-mailem', 'Szybki przelew', 'Opłacone', 180.00, NULL, NULL),
  (981, 'OK-0981', 'Anna Kowalska', 'anna@example.com', '', '2026-10-17', '10:00:00', 'Paragon e-mailem', 'BLIK', 'Odebrane', 96.00, NULL, NULL),
  (902, 'OK-0902', 'Anna Kowalska', 'anna@example.com', '', '2026-09-26', '10:00:00', 'Paragon e-mailem', 'BLIK', 'Anulowane', 120.00, NULL, 'prośba klientki o anulowanie. Zwrot 120,00 zł zakończony.');

INSERT IGNORE INTO order_items (order_id, product_id, product_name, unit_price, quantity, cake_message)
VALUES
  (1041, 2, 'Sernik baskijski', 120.00, 1, NULL),
  (1041, 4, 'Tarta jabłkowa', 96.00, 1, NULL),
  (1043, 3, 'Tort czekoladowy', 140.00, 1, NULL),
  (1045, 2, 'Sernik baskijski', 120.00, 2, NULL),
  (1048, 1, 'Tort waniliowy z wiśnią', 180.00, 1, 'Sto lat!'),
  (1048, 2, 'Sernik baskijski', 120.00, 2, NULL),
  (1050, 1, 'Tort waniliowy z wiśnią', 180.00, 1, NULL),
  (981, 4, 'Tarta jabłkowa', 96.00, 1, NULL),
  (902, 2, 'Sernik baskijski', 120.00, 1, NULL);
