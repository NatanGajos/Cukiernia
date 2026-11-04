const stat = ['Przyjęte', 'Opłacone', 'W przygotowaniu', 'Gotowe do odbioru', 'Odebrane'];
function order(o, full) {
  const its = o.items
    .map((i) => `${i[1]} × ${escapeHtml(pid(i[0]).name)} · ${zl(pid(i[0]).price * i[1])}`)
    .join('<br>');
  if (full) {
    const k = Math.max(stat.indexOf(o.st), 1);
    return `<div class="card" style="padding:22px"><div class="row" style="align-items:center"><div><b>#${escapeHtml(o.id)}</b><br><small style="color:var(--mut)">Złożone ${escapeHtml(o.d)}</small></div><span class="pill">${escapeHtml(o.st)}</span><span class="serif" style="font-size:28px;color:var(--br)">${zl(o.total)}</span></div><div class="tl">${stat.map((s, i) => `<span class="${i == k ? 'on' : ''}">${i < k ? '✓' : i == k ? '●' : '○'} ${s}</span>`).join('')}</div><div class="ord" style="border-top:1px solid var(--ln);padding-top:16px;align-items:start"><div>${its}${o.note ? `<br><small style="color:var(--mut)">napis „${escapeHtml(o.note)}”</small>` : ''}</div><div><b>${escapeHtml(o.d)}${o.t ? ' · ' + escapeHtml(o.t) : ''}</b><br><small style="color:var(--mut)">ul. Słodka 12, Kraków</small><br><button class="u" style="margin:0" data-a="par">Pobierz paragon ↗</button></div></div></div>`;
  }
  return `<div class="card" style="padding:16px;margin-top:12px"><div class="ord" style="margin:0"><div><b>#${escapeHtml(o.id)} · ${o.items.map((i) => escapeHtml(pid(i[0]).name)).join(', ')}</b><br><small style="color:var(--mut)">${escapeHtml(o.d)} 2026</small></div><span class="pill">${escapeHtml(o.st)}</span><span>${zl(o.total)}</span>${o.st == 'Odebrane' ? `<button class="u" data-a="re" data-id="${o.items[0][0]}">Zamów ponownie ↗</button>` : ''}</div>${o.why ? `<small style="color:var(--mut)">Powód: ${escapeHtml(o.why)}</small>` : ''}</div>`;
}
function acc() {
  const mine = S.orders.filter((o) => o.mine),
    act = mine.filter((o) => !['Odebrane', 'Anulowane'].includes(o.st)),
    old = mine.filter((o) => !act.includes(o));
  return (
    head() +
    `<div class="wrap acc"><div class="sd"><div class="av">AK</div><p style="margin:10px 0 0"><b>Anna Kowalska</b><br><small style="color:var(--mut)">anna@example.com</small></p><div style="margin-top:20px"><button class="on">▣ Moje zamówienia</button><button data-a="favs">♡ Lista życzeń · ${S.fav.length}</button><button data-a="dat">☺ Moje dane</button><button data-a="out">⇥ Wyloguj się</button></div><small style="color:var(--mut)">Konto i zamówienia zawierają dane przykładowe.</small></div><div><div class="eb">Twoje małe przyjemności</div><h1 style="font-size:clamp(34px,4.5vw,48px);margin:10px 0">Dzień dobry, Anno.</h1><p style="color:var(--mut)">Tutaj znajdziesz swoje zamówienia i smaki, do których chcesz wrócić.</p><div class="card" style="padding:16px"><b>Jesteśmy w kontakcie — powiadomienia e-mail są włączone</b><br><small style="color:var(--mut)">Każdą zmianę statusu i ewentualne anulowanie z powodem wysyłamy na anna@example.com.</small></div><h2 style="font-size:28px;margin:30px 0 14px">Moje zamówienia</h2>${act.map((o) => order(o, 1)).join('')}${old.map((o) => order(o)).join('')}<h2 style="font-size:28px;margin:36px 0 14px" id="zyczen">Na kolejną słodką chwilę</h2><div class="rv" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin:0">${
      S.fav.length
        ? S.fav
            .map((id) => {
              const p = pid(id);
              return `<div class="card" style="display:flex;gap:14px;padding:12px"><span style="width:90px;flex:none">${img(p)}</span><div><h3 style="font-size:20px">${escapeHtml(p.name)}</h3><div>${zl(p.price)}</div><button class="u" style="margin:4px 0;display:block;color:var(--ink)" data-a="add" data-id="${p.id}">Dodaj do koszyka +</button><button class="u" style="margin:0" data-a="fav" data-id="${p.id}">Usuń z listy</button></div></div>`;
            })
            .join('')
        : '<p>Lista jest pusta. Kliknij ♡ przy wypieku, który Cię kusi.</p>'
    }</div></div></div>` +
    foot()
  );
}
