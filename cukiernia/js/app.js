function render() {
  const h = location.hash.replace('#/', '').split('#')[0],
    [r, a] = h.split('/');
  const keep = document.activeElement?.id;
  $('#app').innerHTML =
    r == 'produkt'
      ? prod(a)
      : r == 'koszyk'
        ? cart()
        : r == 'kasa'
          ? checkout()
          : r == 'konto'
            ? acc()
            : r == 'panel'
              ? adm(a == 'asortyment' ? 'a' : 'o')
              : home();
  if (keep && $('#' + keep) && 'q oq'.includes(keep)) {
    const e = $('#' + keep);
    e.focus();
    e.setSelectionRange(e.value.length, e.value.length);
  }
}
addEventListener('hashchange', () => {
  S.menu = 0;
  const s = location.hash.split('#')[2];
  render();
  if (s) $('#' + s)?.scrollIntoView();
  else if (!location.hash.includes('#/#')) scrollTo(0, 0);
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b) {
    if (e.target.closest('nav a')) {
      S.menu = 0;
    }
    return;
  }
  const a = b.dataset.a,
    d = b.dataset;
  if (a == 'menu') {
    S.menu = !S.menu;
    return render();
  }
  if (a == 'search') {
    location.hash = '#/';
    setTimeout(() => {
      $('#q')?.focus();
      $('#wypieki')?.scrollIntoView();
    }, 50);
    return;
  }
  if (a == 'favs') {
    location.hash = '#/konto';
    setTimeout(() => $('#zyczen')?.scrollIntoView(), 60);
    return;
  }
  if (a == 'fav') {
    const i = +d.id;
    S.fav = S.fav.includes(i) ? S.fav.filter((x) => x != i) : [...S.fav, i];
    save();
    return render();
  }
  if (a == 'cat') {
    S.cat = d.v;
    return render();
  }
  if (a == 'add' || a == 're') return add(d.id);
  if (a == 'dq' || a == 'uq') {
    const q = Math.max(1, +$('#pq').textContent + (a == 'uq' ? 1 : -1));
    $('#pq').textContent = q;
    $('#pt').textContent = zl(q * pid(location.hash.split('/')[2]).price);
    return;
  }
  if (a == 'addp') {
    const q = +$('#pq').textContent;
    S.n = $('#ins').value;
    add(d.id, q, S.n);
    S.n = undefined;
    return;
  }
  if (a == 'rv') return toast('Opinie dodasz po zalogowaniu (wersja demonstracyjna)');
  if (a == 'cq') {
    const c = S.cart[d.i];
    c.q = Math.max(1, c.q + +d.d);
    save();
    return render();
  }
  if (a == 'rm') {
    S.cart.splice(d.i, 1);
    save();
    return render();
  }
  if (a == 'cpn') {
    const v = $('#cp').value.trim().toUpperCase();
    if (v == 'SŁODKO10' || v == 'SLODKO10') {
      S.coupon = 1;
      toast('Rabat zastosowany');
    } else toast('Nieznany kod rabatowy');
    return render();
  }
  if (a == 'cpx') {
    S.coupon = 0;
    return render();
  }
  if (a == 'day') {
    S.date = +d.v;
    return render();
  }
  if (a == 'slot') {
    S.slot = d.v;
    return render();
  }
  if (a == 'pay') return pay();
  if (a == 'go') {
    location.hash = d.v;
    return;
  }
  if (a == 'cal' || a == 'dat' || a == 'par') return toast('Ta sekcja nie jest częścią makiety');
  if (a == 'out') {
    location.hash = '#/';
    return toast('Wylogowano');
  }
  if (a == 'sel') {
    S.sel = d.id;
    return render();
  }
  if (a == 'ssv') {
    const o = S.orders.find((x) => x.id == S.sel);
    return updateOrder(o.id, $('#ss').value);
  }
  if (a == 'cx') {
    const w = $('#why').value.trim();
    if (w.length < 5) {
      $('#e_why').textContent = 'Podaj powód anulowania (min. 5 znaków) — trafi do klientki.';
      return;
    }
    return cancelOrder(S.sel, w);
  }
  if (a == 'edit') {
    S.edit = +d.id;
    return render();
  }
  if (a == 'cancel') return render();
  if (a == 'newp') {
    createProduct({
      name: 'Nowy wypiek',
      cat: 'Torty',
      tag: 'Nowość',
      size: '18 cm · 8 porcji',
      price: 100,
      col: 'naturalny',
      e: '🧁',
      c: ['#f3e4d0', '#c9a283'],
      desc: '',
      ing: '',
      al: [],
    }).catch((error) => {
      console.error('Nie udało się dodać produktu.', error);
      toast(error.message);
    });
    return;
  }
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id == 'q') {
    S.q = t.value;
    $('#grid').innerHTML = grid();
  }
  if (t.id == 'pr') {
    S.pr = t.value;
    $('#grid').innerHTML = grid();
  }
  if (t.id == 'ins') $('#cn').textContent = t.value.length;
  if (t.id == 'oq')
    $('#ol').innerHTML = olist(
      S.orders.filter((o) => !['Odebrane', 'Anulowane'].includes(o.st)),
      t.value
    );
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name == 'doc') {
    S.doc = t.value;
    render();
  }
  if (t.name == 'pay') S.pay = t.value;
  if (t.id == 'pr') {
    S.pr = t.value;
    $('#grid').innerHTML = grid();
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id != 'pf') return;
  e.preventDefault();
  const f = new FormData(e.target),
    p = pid(S.edit);
  updateProduct({
    ...p,
    name: f.get('name'),
    cat: f.get('cat'),
    price: +f.get('price'),
    size: f.get('size'),
    col: f.get('col'),
    desc: f.get('desc'),
    ing: f.get('ing'),
    al: f
      .get('al')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }).catch((error) => {
    console.error('Nie udało się zapisać produktu.', error);
    toast(error.message);
  });
});
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
  apiRequest('orders', {
    method: 'POST',
    body: JSON.stringify({
      name: `${$('#fn').value.trim()} ${$('#ln').value.trim()}`,
      email: $('#em').value.trim(),
      phone: $('#ph').value.trim(),
      pickupDate: `2026-11-${String(S.date).padStart(2, '0')}`,
      pickupTime: S.slot.slice(0, 5),
      receipt: S.doc,
      payment: S.pay,
      coupon: S.coupon,
      termsAccepted: $('#tos').checked,
    }),
  })
    .then(({ order }) => {
      S.orders.unshift({
        ...order,
        d: formatOrderDate(order.pickupDate),
      });
      S.cart = [];
      S.date = S.slot = null;
      try {
        localStorage.setItem('ok', JSON.stringify({ cart: S.cart, fav: S.fav }));
      } catch (error) {
        console.error('Nie udało się zapisać lokalnej kopii koszyka.', error);
      }

      toast('Dziękujemy! Zamówienie #' + order.id + ' przyjęte');
      location.hash = '#/konto';
    })
    .catch((error) => {
      console.error('Nie udało się złożyć zamówienia.', error);
      toast(error.message);
    });
}

initializeDatabase()
  .then(render)
  .catch((error) => {
    databaseError = true;
    console.error('Nie udało się połączyć z MariaDB.', error);
    render();
    toast(error.message);
  });
