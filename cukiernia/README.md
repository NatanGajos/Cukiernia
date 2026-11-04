# Okruszyna

Strona używa PHP z XAMPP jako lokalnego API, a MariaDB przechowuje produkty, koszyki, listy ulubionych i zamówienia.

## Pierwsze uruchomienie

1. W XAMPP Control Panel uruchom **Apache** i **MySQL**.
2. Zaimportuj `database/schema.sql` w phpMyAdmin (`http://localhost/phpmyadmin`, karta **Import**). Plik jest zapisany w UTF-8.
3. Ustaw dostęp do bazy w `api/config.local.php`. Plik zawiera domyślne ustawienia świeżej instalacji XAMPP; po ustawieniu hasła użytkownika MariaDB zaktualizuj pole `password`.
4. Otwórz `http://localhost/cukiernia/Cukiernia/cukiernia/`.

## Struktura stron

- `index.html` — strona główna i katalog wypieków.
- `produkt.html?id=1` — szczegóły produktu.
- `koszyk.html` — koszyk.
- `kasa.html` — dane odbioru i złożenie zamówienia.
- `konto.html` — rejestracja, logowanie i historia zamówień.
- `panel.html` — panel pracowni.
- `templates.html` — wspólny nagłówek i stopka używane przez wszystkie strony.

Pliki HTML określają strukturę stron, JavaScript obsługuje dane, API i interakcje, a CSS odpowiada za wygląd.

## Panel administratora

Panel jest dostępny wyłącznie dla konta z rolą `admin`.

Konto demonstracyjne:

- e-mail: `admin@okruszyna.local`
- hasło: `Admin123!`

Zwykłe konta klientów nie mogą otworzyć panelu ani wywołać administracyjnych endpointów API.

Folder `C:\xampp\htdocs\cukiernia` jest skrótem do projektu na Pulpicie. Jeśli skrótu brakuje, utwórz go w PowerShell:

```powershell
New-Item -ItemType Junction -Path 'C:\xampp\htdocs\cukiernia' -Target 'C:\Users\pniep\Desktop\cukiernia'
```

Schemat możesz też zaimportować z wiersza poleceń, zachowując polskie znaki:

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' --default-character-set=utf8mb4 -u root -p --execute='source C:/xampp/htdocs/cukiernia/database/schema.sql'
```

Serwer API działa tylko lokalnie. To demonstracyjny sklep bez logowania administratora i integracji płatności — nie udostępniaj go w internecie ani w sieci lokalnej. Zapisywany jest wybrany sposób płatności, nigdy dane karty.
