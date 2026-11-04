const $ = (s) => document.querySelector(s),
  zl = (n) => n.toFixed(2).replace('.', ',') + ' zł';
const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]
  );
const P = [
  {
    id: 1,
    name: 'Tort waniliowy z wiśnią',
    cat: 'Torty',
    tag: 'Na wyjątkowe chwile',
    size: '18 cm · 8–10 porcji',
    price: 180,
    col: 'kremowy z wiśnią',
    e: '🎂',
    c: ['#f3e4d0', '#b5483f'],
    desc: 'Puszysty biszkopt, krem z prawdziwą wanilią i kwaskowe wiśnie. Delikatny, nieprzesłodzony — gotowy, by świętować z Tobą.',
    ing: 'śmietanka 36%, mascarpone, jaja, mąka pszenna, wiśnie 18%, cukier, masło, mleko, wanilia, skrobia ziemniaczana, żelatyna.',
    al: ['gluten (pszenica)', 'jaja', 'mleko'],
  },
  {
    id: 2,
    name: 'Sernik baskijski',
    cat: 'Serniki',
    tag: 'Ulubieniec pracowni',
    size: '20 cm · 8 porcji',
    price: 120,
    col: 'karmelowy',
    e: '🍰',
    c: ['#e8c99a', '#9a5b2e'],
    desc: 'Kremowy środek i mocno przypieczona góra. Tak właśnie powinien smakować sernik.',
    ing: 'serek śmietankowy, śmietanka, jaja, cukier, mąka, wanilia.',
    al: ['gluten (pszenica)', 'jaja', 'mleko'],
  },
  {
    id: 3,
    name: 'Tort czekoladowy',
    cat: 'Torty',
    tag: 'Intensywnie czekoladowy',
    size: '18 cm · 8 porcji',
    price: 140,
    col: 'czekoladowy',
    e: '🍫',
    c: ['#9c6a4f', '#3b2218'],
    desc: 'Wilgotny biszkopt kakaowy i gęsty krem ganache z gorzkiej czekolady.',
    ing: 'czekolada gorzka, masło, jaja, cukier, mąka, kakao, śmietanka.',
    al: ['gluten (pszenica)', 'jaja', 'mleko'],
  },
  {
    id: 4,
    name: 'Tarta jabłkowa',
    cat: 'Tarty',
    tag: 'Smak jesieni',
    size: '24 cm · 8 porcji',
    price: 96,
    col: 'złoty',
    e: '🥧',
    c: ['#f0d7a8', '#c98a3d'],
    desc: 'Kruche ciasto, jabłka z cynamonem ułożone w różę.',
    ing: 'jabłka, mąka, masło, cukier, jaja, cynamon.',
    al: ['gluten (pszenica)', 'jaja', 'mleko'],
  },
];
const S = {
  cart: [
    { id: 1, q: 1, n: 'Sto lat!' },
    { id: 2, q: 2, n: '' },
  ],
  fav: [1, 3],
  coupon: true,
  cat: 'Wszystkie',
  q: '',
  pr: '',
  orders: [
    {
      id: 'OK-1041',
      name: 'Jan Wiśniewski',
      items: [
        [2, 1],
        [4, 1],
      ],
      total: 216,
      st: 'Opłacone',
      d: '5 lis',
      t: '10:00',
      mine: 0,
    },
    {
      id: 'OK-1043',
      name: 'Ewa Mazur',
      items: [[3, 1]],
      total: 140,
      st: 'W przygotowaniu',
      d: '5 lis',
      t: '13:00',
      mine: 0,
    },
    {
      id: 'OK-1045',
      name: 'Piotr Wójcik',
      items: [[2, 2]],
      total: 240,
      st: 'Opłacone',
      d: '6 lis',
      t: '11:00',
      mine: 0,
    },
    {
      id: 'OK-1048',
      name: 'Anna Kowalska',
      items: [
        [1, 1],
        [2, 2],
      ],
      total: 378,
      st: 'W przygotowaniu',
      d: '7 lis',
      t: '12:00',
      mine: 1,
      note: 'Sto lat!',
    },
    {
      id: 'OK-1050',
      name: 'Alicja Lis',
      items: [[1, 1]],
      total: 180,
      st: 'Opłacone',
      d: '7 lis',
      t: '14:00',
      mine: 0,
    },
    {
      id: 'OK-0981',
      name: 'Anna Kowalska',
      items: [[4, 1]],
      total: 96,
      st: 'Odebrane',
      d: '17 paź',
      t: '',
      mine: 1,
    },
    {
      id: 'OK-0902',
      name: 'Anna Kowalska',
      items: [[2, 1]],
      total: 120,
      st: 'Anulowane',
      d: '26 wrz',
      t: '',
      mine: 1,
      why: 'prośba klientki o anulowanie. Zwrot 120,00 zł zakończony.',
    },
  ],
  sel: 'OK-1048',
  edit: 1,
  date: null,
  slot: null,
  doc: 'Paragon e-mailem',
  pay: 'BLIK',
  menu: 0,
};
try {
  const s = JSON.parse(localStorage.getItem('ok') || 'null');
  if (s) {
    S.cart = s.cart;
    S.fav = s.fav;
  }
} catch (e) {}
function save() {
  try {
    localStorage.setItem('ok', JSON.stringify({ cart: S.cart, fav: S.fav }));
  } catch (error) {
    console.error('Nie udało się zapisać lokalnej kopii koszyka.', error);
  }

  if (!databaseReady) {
    if (databaseError) {
      toast('Nie zapisano zmian. Sprawdź połączenie z bazą MariaDB.');
    }

    return Promise.resolve();
  }

  return apiRequest('saved', {
    method: 'PUT',
    body: JSON.stringify({ cart: S.cart, fav: S.fav }),
  }).catch((error) => {
    console.error('Nie udało się zapisać koszyka w MariaDB.', error);
    toast('Nie udało się zapisać koszyka w bazie MariaDB.');
  });
}
const toast = (m) => {
  const t = $('#toast');
  t.innerHTML = '<div class="toast" role="status">' + m + '</div>';
  setTimeout(() => (t.innerHTML = ''), 2600);
};
const pid = (id) => P.find((p) => p.id == id);
const img = (p, cls = '') =>
  `<span class="ph ${cls}" style="--c1:${p.c[0]};--c2:${p.c[1]}"><span class="e">${escapeHtml(p.e)}</span></span>`;
const count = () => S.cart.reduce((a, c) => a + c.q, 0);
const sum = () => S.cart.reduce((a, c) => a + pid(c.id).price * c.q, 0),
  disc = () => (S.coupon ? sum() * 0.1 : 0);
function add(id, q = 1, n = '') {
  const c = S.cart.find((x) => x.id == id);
  c ? (c.q += q) : S.cart.push({ id: +id, q, n });
  save();
  toast('Dodano do koszyka');
  render();
}
