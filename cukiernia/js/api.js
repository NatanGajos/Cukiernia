const apiSessionKey = 'okruszyna-session';
let databaseReady = false;
let databaseError = false;

function getApiSessionId() {
  let id = localStorage.getItem(apiSessionKey);

  if (!id || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(apiSessionKey, id);
  }

  return id;
}

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(new URL(`api/${path}`, document.baseURI), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': getApiSessionId(),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error('Nie można połączyć się z serwerem XAMPP. Sprawdź, czy działa Apache.', {
      cause: error,
    });
  }

  let result;

  try {
    result = await response.json();
  } catch (error) {
    throw new Error('Serwer nie zwrócił prawidłowej odpowiedzi API.', { cause: error });
  }

  if (!response.ok) {
    throw new Error(result.error || `Żądanie do bazy nie powiodło się (${response.status}).`);
  }

  return result;
}

function formatOrderDate(date) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00`))
    .replace(/\.$/, '');
}

async function initializeDatabase() {
  const state = await apiRequest('bootstrap');

  if (!Array.isArray(state.products) || !Array.isArray(state.orders)) {
    throw new Error('Baza danych zwróciła nieprawidłowe dane strony.');
  }

  P.splice(0, P.length, ...state.products);
  S.orders = state.orders.map((order) => ({
    ...order,
    d: formatOrderDate(order.pickupDate),
  }));
  S.sel = S.orders.some((order) => order.id === S.sel) ? S.sel : (S.orders[0]?.id ?? null);
  S.edit = P.some((product) => product.id === S.edit) ? S.edit : (P[0]?.id ?? null);

  if (state.saved) {
    S.cart = state.saved.cart;
    S.fav = state.saved.fav;
  } else {
    await apiRequest('saved', {
      method: 'PUT',
      body: JSON.stringify({ cart: S.cart, fav: S.fav }),
    });
  }

  databaseReady = true;
  databaseError = false;
}

async function updateOrder(id, status) {
  try {
    const result = await apiRequest(`orders/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    const index = S.orders.findIndex((order) => order.id === id);

    if (index !== -1) {
      S.orders[index] = {
        ...result.order,
        d: formatOrderDate(result.order.pickupDate),
      };
    }

    toast('Zapisano status zamówienia.');
    render();
  } catch (error) {
    console.error('Nie udało się zapisać statusu zamówienia.', error);
    toast(error.message);
  }
}

async function cancelOrder(id, reason) {
  try {
    const result = await apiRequest(`orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const index = S.orders.findIndex((order) => order.id === id);

    if (index !== -1) {
      S.orders[index] = {
        ...result.order,
        d: formatOrderDate(result.order.pickupDate),
      };
    }

    S.sel = null;
    toast('Zamówienie anulowane.');
    render();
  } catch (error) {
    console.error('Nie udało się anulować zamówienia.', error);
    toast(error.message);
  }
}

async function createProduct(product) {
  const result = await apiRequest('products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  P.push(result.product);
  S.edit = result.product.id;
  toast('Dodano produkt do bazy.');
  render();
}

async function updateProduct(product) {
  const result = await apiRequest(`products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
  const index = P.findIndex((item) => item.id === result.product.id);

  if (index !== -1) {
    P[index] = result.product;
  }

  toast('Zapisano produkt w bazie.');
  render();
}
