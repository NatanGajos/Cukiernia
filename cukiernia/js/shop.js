function card(p) {
  const f = S.fav.includes(p.id);
  return `<article class="pc"><div style="position:relative"><button class="hrt" data-a="fav" data-id="${p.id}" aria-label="Ulubione" aria-pressed="${f}">${f ? '♥' : '♡'}</button><a href="#/produkt/${p.id}">${img(p)}</a></div><div class="tg">${escapeHtml(p.tag)}</div><a href="#/produkt/${p.id}"><h3>${escapeHtml(p.name)}</h3></a><small>${escapeHtml(p.size)}</small><div class="pr"><span>${zl(p.price)}</span><button class="pl" data-a="add" data-id="${p.id}" aria-label="Dodaj do koszyka">+</button></div></article>`;
}
function list() {
  const q = S.q.toLowerCase();
  return P.filter(
    (p) =>
      (S.cat == 'Wszystkie' || p.cat == S.cat) &&
      p.name.toLowerCase().includes(q) &&
      (!S.pr || (S.pr == 'lo' ? p.price < 130 : p.price >= 130))
  );
}
function grid() {
  const l = list();
  return l.length
    ? l.map(card).join('')
    : '<p style="grid-column:1/-1">Nic nie znaleźliśmy. Spróbuj innej nazwy lub wyczyść filtry.</p>';
}
const rev = (n, t, p) =>
  `<blockquote><span class="st">★★★★★</span><q>„${t}”</q><small>${n} · ${p}</small></blockquote>`;
function home() {
  return (
    head() +
    `<div class="hero"><div class="wrap"><div><div class="eb">Z miłości do małych przyjemności</div><h1>Życie smakuje lepiej z ciastem.</h1><p>Prawdziwe masło, sezonowe owoce i odrobina czułości. Wypieki na Twoje wielkie chwile i całkiem zwykłe popołudnia.</p><p><a class="btn" href="#/#wypieki">Znajdź swoje ciasto ↗</a></p><small style="color:var(--mut)">Na zamówienie · Odbiór już za 2 dni</small></div><div class="ph hi" style="--c1:#efe0cd;--c2:#b8895f">🎂<div class="cap">NASZ SŁODKI PODPIS<b>Wanilia &amp; wiśnia</b></div></div></div></div>
<section id="wypieki"><div class="wrap"><div class="row"><div><div class="eb">Dobre rzeczy, proste składniki</div><h2 style="margin-top:10px">Na co masz ochotę?</h2></div><small style="color:var(--mut)">4 autorskie wypieki</small></div>
<div class="chips" role="group">${['Wszystkie', 'Torty', 'Serniki', 'Tarty'].map((c) => `<button class="chip ${S.cat == c ? 'on' : ''}" data-a="cat" data-v="${c}">${c}</button>`).join('')}</div>
<div class="fl"><input class="in" id="q" placeholder="Szukaj po nazwie, np. sernik" value="${escapeHtml(S.q)}" aria-label="Szukaj"><select class="in" id="pr" aria-label="Cena"><option value="">Cena: wszystkie</option><option value="lo" ${S.pr == 'lo' ? 'selected' : ''}>do 130 zł</option><option value="hi" ${S.pr == 'hi' ? 'selected' : ''}>od 130 zł</option></select></div>
<div class="grid" id="grid">${grid()}</div><div class="note">Każde ciasto pieczemy dla Ciebie. Dostępny termin odbioru wybierzesz w kasie.</div></div></section>
<section class="alt" id="jak"><div class="wrap"><h2>Od naszej pracowni do Twojego stołu.</h2><div class="steps"><div><i>01</i><b>Wybierz coś pysznego</b><p>Znajdź swój smak. Do tortu dodaj osobisty napis od nas, bez dopłaty.</p></div><div><i>02</i><b>Zarezerwuj odbiór</b><p>Wybierz wolny dzień i godzinę, minimum 2 dni wcześniej. Zapłać wygodnie online.</p></div><div><i>03</i><b>Wpadnij do Okruszyny</b><p>Odbierz świeży wypiek przy ul. Słodkiej 12 w Krakowie. O statusie damy znać e-mailem.</p></div></div></div></section>
<section id="historia"><div class="wrap story"><div class="ph" style="--c1:#d9b48a;--c2:#7b5436">👩‍🍳</div><div><div class="eb">Ręce, serce i prawdziwe masło</div><h2 style="margin:12px 0 16px">Nie idziemy na skróty. Wolimy piec.</h2><p>W Okruszynie liczy się to, co w środku. Wanilia, którą naprawdę czuć. Twaróg, który nie potrzebuje udawać. Owoce, które smakują swoim sezonem. Każdy wypiek powstaje w małych partiach i przechodzi przez nasze ręce. Bo dobre ciasto potrzebuje czasu, nie pośpiechu.</p><a class="btn o" href="#/panel">Poznaj naszą pracownię ↗</a></div></div></section>
<section style="padding-top:0"><div class="wrap"><h2>Najlepiej smakuje razem.</h2><small style="color:var(--mut)">Przykładowe opinie i oceny — treści demonstracyjne projektu.</small><div class="rv">${rev('Anna', 'Lekki krem i wiśnie, które przełamują słodycz. Tort zniknął do ostatniego okruszka.', 'Tort waniliowy z wiśnią') + rev('Michał', 'Kremowy środek, pięknie przypieczona góra. Tak właśnie powinien smakować sernik.', 'Sernik baskijski') + rev('Zofia', 'Odbiór punktualnie, wszystko pięknie zapakowane. Mały rytuał na wielką okazję.', 'Tarta jabłkowa')}</div></div></section>
<footer><div class="wrap"><div class="fg"><div><a class="logo" href="#/">okruszyna</a><p style="margin-top:12px">Małe przyjemności.<br>Wielkie okazje do świętowania.</p><a href="#/">Instagram ↗</a><a href="#/">Facebook ↗</a></div><div><p><b>Odwiedź pracownię</b></p><p>ul. Słodka 12, Kraków</p><p>Wt–pt 10:00–18:00</p><p>Sob 10:00–16:00</p></div><div><p><b>Dobrze wiedzieć</b></p><p>Zamówienia i odbiór</p><p>Skład i alergeny</p><p>hej@okruszyna.example</p></div></div>© 2026 Okruszyna · Projekt fikcyjnej cukierni <a href="#/">Regulamin</a><a href="#/">Prywatność</a><a href="#/">Ustawienia cookies</a></div></footer>`
  );
}
function prod(id) {
  const p = pid(id);
  if (!p) return home();
  const n = S.n ?? 'Sto lat!';
  return (
    head() +
    `<div class="wrap"><div class="crumb"><a href="#/">Strona główna</a> / ${escapeHtml(p.cat)} / ${escapeHtml(p.name)}</div><div class="pd"><div><div class="ph big" style="--c1:${p.c[0]};--c2:${p.c[1]}">${escapeHtml(p.e)}<span class="pill" style="position:absolute;left:14px;top:14px;font-size:12px;font-family:Inter;color:var(--ac)">${escapeHtml(p.tag)}</span></div><div class="th"><span class="ph" style="--c1:${p.c[1]};--c2:${p.c[0]}">${escapeHtml(p.e)}</span><span class="ph" style="--c1:${p.c[0]};--c2:#fff">${escapeHtml(p.e)}</span><span>Każdy wypiek dekorujemy ręcznie. Twój może nieznacznie różnić się od zdjęcia.</span></div></div>
<div><div class="eb">Kolekcja Okruszyny · ${escapeHtml(p.cat)}</div><h1 style="font-size:clamp(34px,4vw,48px);margin:12px 0">${escapeHtml(p.name)}</h1><div class="st" style="font-size:13px">★★★★★ <span style="color:var(--ac);letter-spacing:0">4,9 / 5 · 12 przykładowych ocen</span></div><div class="serif" style="font-size:30px;color:var(--br);margin:18px 0">${zl(p.price)}</div><p style="color:var(--mut);border-bottom:1px solid var(--ln);padding-bottom:18px">${escapeHtml(p.desc)}</p>
<label class="l">Rozmiar i liczba porcji</label><div class="opt"><span>◉ ${escapeHtml(p.size)}</span><span>${zl(p.price)}</span></div><div>Kolor: ${escapeHtml(p.col)}</div>
<label class="l" for="ins">Twój napis na torcie · opcjonalnie, gratis</label><input class="in w" id="ins" maxlength="30" value="${escapeHtml(n)}"><small style="color:var(--mut)"><span id="cn">${escapeHtml(n.length)}</span> / 30 znaków · Krótkie słowa, dużo radości.</small>
<div style="display:flex;gap:12px;margin:18px 0"><div class="qty"><button data-a="dq" aria-label="Mniej">−</button><span id="pq">1</span><button data-a="uq" aria-label="Więcej">+</button></div><button class="btn" style="flex:1" data-a="addp" data-id="${p.id}">Dodaj do koszyka · <span id="pt">${zl(p.price)}</span></button></div><button class="u" style="margin:0" data-a="fav" data-id="${p.id}">${S.fav.includes(p.id) ? '♥ Zapisano' : '♡ Zapisz na później'}</button> <small style="color:var(--mut)">· Odbiór od 6 listopada</small></div></div>
<div class="two" style="grid-template-columns:1fr 1fr;margin:56px 0"><div><h2>To, co w środku, ma znaczenie.</h2><p style="color:var(--mut)">Skład: ${escapeHtml(p.ing)}</p><div class="card" style="padding:16px"><b>Alergeny: ${escapeHtml(p.al.join(', '))}</b><p style="margin:6px 0 0;color:var(--mut);font-size:13px">W pracowni używamy też orzechów, orzeszków ziemnych, soi i sezamu. Produkt może zawierać ich śladowe ilości.</p></div><p style="color:var(--mut);font-size:13px">Przechowuj w 2–6°C. Najlepiej smakuje w ciągu 48 godzin od odbioru. Wyjmij z lodówki 20 minut przed podaniem.</p></div><div><div class="row"><h2>Słodkie słowa</h2><button class="btn o" data-a="rv">Dodaj opinię</button></div><small style="color:var(--mut)">Oceny i opinie są przykładową treścią projektu.</small>${[
      ['Anna', 'Lekki krem i wiśnie, które przełamują słodycz.'],
      ['Kasia', 'Piękna dekoracja i delikatna wanilia. Napis był dokładnie taki, jak chciałam.'],
    ]
      .map(
        (r) =>
          `<div style="border-top:1px solid var(--ln);padding:14px 0;margin-top:14px"><div class="row"><b>${r[0]}</b><span class="st">★★★★★</span></div><p style="color:var(--mut);margin:6px 0 0">„${r[1]}”</p></div>`
      )
      .join('')}</div></div></div>` +
    foot()
  );
}
function cart() {
  const items = S.cart
    .map((c, i) => {
      const p = pid(c.id);
      return `<div class="ci"><a href="#/produkt/${p.id}">${img(p)}</a><div><h3>${escapeHtml(p.name)}</h3><small>${escapeHtml(p.size)} · ${escapeHtml(p.col)}</small>${c.n ? `<small style="color:var(--ac)">Napis: „${escapeHtml(c.n)}” · bez dopłaty</small>` : `<small style="color:var(--ac)">${zl(p.price)} / szt.</small>`}<div style="margin-top:10px"><span class="qty"><button data-a="cq" data-i="${i}" data-d="-1" aria-label="Mniej">−</button><span>${c.q}</span><button data-a="cq" data-i="${i}" data-d="1" aria-label="Więcej">+</button></span><button class="u" data-a="rm" data-i="${i}">Usuń</button></div></div><b>${zl(p.price * c.q)}</b></div>`;
    })
    .join('');
  return (
    head() +
    `<div class="wrap" style="padding-bottom:50px"><div class="row" style="padding-top:44px"><div><div class="eb">Jeszcze chwila do czegoś pysznego</div><h1 style="font-size:clamp(36px,5vw,52px);margin-top:10px">Twój koszyk</h1></div><small><b>01 Koszyk</b> &nbsp; 02 Dane i odbiór — 03 Płatność</small></div>
${
  S.cart.length
    ? `<div class="two" style="margin-top:30px"><div><div class="row" style="color:var(--mut);font-size:13px;border-bottom:1px solid var(--ln);padding-bottom:10px"><span>${S.cart.length} produkty · ${count()} sztuk</span><span>Wartość</span></div>${items}
<div class="card" style="margin-top:22px;padding:20px"><b>Masz coś słodkiego w zanadrzu?</b><div style="display:flex;gap:10px;margin:12px 0"><input class="in w" id="cp" value="${S.coupon ? 'SŁODKO10' : ''}" placeholder="Kod rabatowy"><button class="btn o" data-a="cpn" style="white-space:nowrap">${S.coupon ? 'Zastosowano ✓' : 'Zastosuj'}</button></div>${S.coupon ? `<small style="color:var(--ac)">Rabat 10% na produkty: oszczędzasz ${zl(disc())} <button class="u" data-a="cpx">Usuń kod</button></small>` : '<small style="color:var(--mut)">Wpisz SŁODKO10, aby dostać 10% rabatu.</small>'}</div><p><a href="#/" style="color:var(--mut)">← Wróć po jeszcze jeden okruszek</a></p></div>${summary(1)}</div>`
    : `<div class="card" style="margin-top:30px;text-align:center"><p>Koszyk jest pusty. Wybierz coś pysznego.</p><a class="btn" href="#/">Zobacz wypieki</a></div>`
}</div>` +
    foot()
  );
}
function summary(go) {
  const b = sum(),
    d = disc(),
    t = b - d;
  return `<aside><div class="card sm"><h2 style="font-size:28px;margin-bottom:14px">Twoje zamówienie</h2>${go ? '' : S.cart.map((c) => `<div style="color:var(--ink)"><span>${c.q} × ${escapeHtml(pid(c.id).name)}</span><span>${zl(pid(c.id).price * c.q)}</span></div>`).join('')}<div><span>Wartość produktów</span><span>${zl(b)}</span></div>${S.coupon ? `<div><span>Rabat SŁODKO10 (−10%)</span><span>−${zl(d)}</span></div>` : ''}<div><span>Odbiór w pracowni</span><span>0,00 zł</span></div><div class="tot"><span>Do zapłaty</span><span class="serif">${zl(t)}</span></div><small style="color:var(--mut)">Cena zawiera VAT. Napis na torcie gratis.</small>${go ? '<a class="btn w" href="#/kasa" style="margin:14px 0 8px">Przejdź do kasy →</a>' : '<button class="btn w" data-a="pay" style="margin:14px 0 8px">Zamawiam i płacę · ' + zl(t) + '</button>'}<small style="display:block;text-align:center;color:var(--mut)">BLIK · Karta · Szybki przelew</small></div>${go ? '<div class="card" style="margin-top:14px;padding:16px;font-size:13px"><b>Odbiór w naszej pracowni</b><br><span style="color:var(--mut)">ul. Słodka 12, Kraków. Termin wybierzesz w kolejnym kroku. Nie musisz zakładać konta.</span></div>' : ''}</aside>`;
}
