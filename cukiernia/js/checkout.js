const DN = ['Czw', 'Pt', 'Sob', 'Nd', 'Pon', 'Wt', 'Śr'],
  SL = ['10:00–11:00', '11:00–12:00', '12:00–13:00', '13:00–14:00'];
function checkout() {
  if (!S.cart.length) {
    location.hash = '#/koszyk';
    return '';
  }
  return (
    head(1) +
    `<div class="wrap" style="padding-bottom:50px"><div class="row" style="padding:40px 0 24px"><h1 style="font-size:clamp(32px,4.5vw,46px)">Ostatni krok do przyjemności.</h1><small style="color:var(--mut)">✓ Koszyk — 02 Dane i odbiór — 03 Płatność</small></div><div class="two"><div style="display:grid;gap:16px">
<div class="card row" style="padding:16px"><div><b>Kupujesz bez zakładania konta</b><br><small style="color:var(--mut)">Potwierdzenie i statusy wyślemy na Twój e-mail.</small></div><a href="#/konto" style="font-size:12px">Masz konto? Zaloguj się</a></div>
<div class="card"><h2 style="font-size:24px;margin-bottom:16px">01 &nbsp;Jak się z Tobą skontaktować?</h2><div class="f2">${[
      ['fn', 'Imię', 'Anna'],
      ['ln', 'Nazwisko', 'Kowalska'],
      ['em', 'Adres e-mail', 'anna@example.com'],
      ['ph', 'Telefon', '500 600 700'],
    ]
      .map(
        (f) =>
          `<div><label class="l" style="margin-top:0" for="${f[0]}">${f[1]} *</label><input class="in w" id="${f[0]}" value="${f[2]}"><div class="err" id="e_${f[0]}"></div></div>`
      )
      .join('')}</div></div>
<div class="card"><h2 style="font-size:24px;margin-bottom:10px">02 &nbsp;Kiedy się widzimy?</h2><small style="color:var(--mut)">Okruszyna · ul. Słodka 12, Kraków · odbiór gratis</small><p style="margin:14px 0 0"><b style="font-size:13px">Listopad 2026</b></p><div class="days">${DN.map((n, i) => `<button class="d ${S.date == i + 5 ? 'on' : ''}" data-a="day" data-v="${i + 5}" ${i == 3 || i == 4 ? 'disabled' : ''}>${n}<b>${i + 5}</b></button>`).join('')}</div><small style="color:var(--mut)">Wyszarzone daty: pracownia nieczynna. Zamawiamy z min. 2-dniowym wyprzedzeniem.</small><div class="sl" style="margin:14px 0">${SL.map((s) => `<button class="d ${S.slot == s ? 'on' : ''}" data-a="slot" data-v="${s}">${s}</button>`).join('')}</div>${S.date && S.slot ? `<small style="color:var(--ac)">✓ Wybrano: ${DN[S.date - 5]}, ${S.date} listopada 2026 · ${S.slot}</small>` : '<small class="err" id="e_dt"></small>'}</div>
<div class="card"><h2 style="font-size:24px;margin-bottom:12px">03 &nbsp;Dokument sprzedaży</h2><div class="rg">${['Paragon e-mailem', 'Faktura VAT'].map((v) => `<label><input type="radio" name="doc" value="${v}" ${S.doc == v ? 'checked' : ''}> ${v}</label>`).join('')}</div>${S.doc == 'Faktura VAT' ? '<div class="f2" style="margin-top:12px"><input class="in" placeholder="Nazwa firmy"><input class="in" placeholder="NIP"></div>' : ''}</div>
<div class="card"><h2 style="font-size:24px;margin-bottom:12px">04 &nbsp;Jak chcesz zapłacić?</h2><div class="rg">${[
      ['BLIK', 'Kod z aplikacji banku'],
      ['Karta', 'Visa, Mastercard'],
      ['Szybki przelew', 'Wybierz swój bank'],
    ]
      .map(
        (v) =>
          `<label><input type="radio" name="pay" value="${v[0]}" ${S.pay == v[0] ? 'checked' : ''}> <b>${v[0]}</b><br><small style="color:var(--mut)">${v[1]}</small></label>`
      )
      .join('')}</div></div></div>
<div>${summary(0)}${S.date && S.slot ? `<div class="card" style="margin-top:14px;padding:16px;font-size:13px"><b>Twój słodki plan</b><br>${S.date} listopada 2026, ${S.slot.replace('–', '–')} · ul. Słodka 12, Kraków</div>` : ''}<label style="display:flex;gap:10px;margin-top:16px;font-size:13px;color:var(--mut)"><input type="checkbox" id="tos"> Akceptuję regulamin sklepu i zapoznałam się z polityką prywatności. *</label><div class="err" id="e_tos"></div></div></div></div>` +
    foot()
  );
}
function pay() {
  let ok = 1;
  const er = (k, m) => {
    const e = $('#e_' + k);
    if (e) e.textContent = m;
    $('#' + k)?.classList.toggle('bad', !!m);
    if (m) ok = 0;
  };
  ['fn', 'ln'].forEach((k) => er(k, $('#' + k).value.trim() ? '' : 'Uzupełnij to pole.'));
  er('em', /^\S+@\S+\.\S+$/.test($('#em').value) ? '' : 'Podaj poprawny adres e-mail.');
  er('ph', /^[\d\s+]{9,}$/.test($('#ph').value) ? '' : 'Podaj numer telefonu (min. 9 cyfr).');
  er('dt', S.date && S.slot ? '' : 'Wybierz dzień i godzinę odbioru.');
  er('tos', $('#tos').checked ? '' : 'Zaakceptuj regulamin, aby złożyć zamówienie.');
  if (!ok) {
    toast('Sprawdź zaznaczone pola');
    return;
  }
  const id = 'OK-' + (1051 + S.orders.length - 7),
    t = sum() - disc();
  S.orders.push({
    id,
    name: $('#fn').value + ' ' + $('#ln').value,
    items: S.cart.map((c) => [c.id, c.q]),
    total: t,
    st: 'Opłacone',
    d: S.date + ' lis',
    t: S.slot.slice(0, 5),
    mine: 1,
    note: S.cart.find((c) => c.n)?.n,
  });
  S.cart = [];
  S.date = S.slot = null;
  save();
  toast('Dziękujemy! Zamówienie #' + id + ' przyjęte');
  location.hash = '#/konto';
}
