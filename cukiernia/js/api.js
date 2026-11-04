const API_SESSION_STORAGE_KEY = "okruszyna-session";
let databaseReady = false;
let databaseError = false;

function getApiSessionId() {
  let sessionId = localStorage.getItem(API_SESSION_STORAGE_KEY);

  if (
    !sessionId ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(sessionId)
  ) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(API_SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

async function apiRequest(apiPath, requestOptions = {}) {
  let response;

  try {
    response = await fetch(
      new URL(`api/index.php/${apiPath}`, document.baseURI),
      {
        ...requestOptions,
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": getApiSessionId(),
          ...(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
            ? { "X-Auth-Token": localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) }
            : {}),
          ...requestOptions.headers,
        },
      },
    );
  } catch (error) {
    throw new Error(
      "Nie można połączyć się z serwerem XAMPP. Sprawdź, czy działa Apache.",
      {
        cause: error,
      },
    );
  }

  let responseData;

  try {
    responseData = await response.json();
  } catch (error) {
    throw new Error("Serwer nie zwrócił prawidłowej odpowiedzi API.", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(
      responseData.error ||
        `Żądanie do bazy nie powiodło się (${response.status}).`,
    );
  }

  return responseData;
}

function formatOrderDate(dateString) {
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" })
    .format(new Date(`${dateString}T12:00:00`))
    .replace(/\.$/, "");
}

async function initializeDatabase() {
  const bootstrapData = await apiRequest("bootstrap");

  if (
    !Array.isArray(bootstrapData.products) ||
    !Array.isArray(bootstrapData.orders)
  ) {
    throw new Error("Baza danych zwróciła nieprawidłowe dane strony.");
  }

  products.splice(0, products.length, ...bootstrapData.products);
  appState.orders = bootstrapData.orders.map((order) => ({
    ...order,
    d: formatOrderDate(order.pickupDate),
  }));
  appState.account = bootstrapData.account;
  appState.sel = appState.orders.some((order) => order.id === appState.sel)
    ? appState.sel
    : (appState.orders[0]?.id ?? null);
  appState.edit = products.some((product) => product.id === appState.edit)
    ? appState.edit
    : (products[0]?.id ?? null);

  const hasSavedCustomerData = Boolean(
    localStorage.getItem(CUSTOMER_DATA_STORAGE_KEY),
  );
  const isAuthenticated = Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));

  if (bootstrapData.saved && (hasSavedCustomerData || isAuthenticated)) {
    appState.cart = bootstrapData.saved.cart;
    appState.fav = bootstrapData.saved.fav;
  } else {
    await apiRequest("saved", {
      method: "PUT",
      body: JSON.stringify({ cart: appState.cart, fav: appState.fav }),
    });
  }

  databaseReady = true;
  databaseError = false;
}

async function authenticateAccount(authenticationAction, accountData) {
  const authenticationResult = await apiRequest(
    `auth/${authenticationAction}`,
    {
      method: "POST",
      body: JSON.stringify(accountData),
    },
  );

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authenticationResult.token);
  appState.account = authenticationResult.account;
  await initializeDatabase();
  location.href = "konto.html";
}

async function logoutAccount() {
  try {
    await apiRequest("auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } finally {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    appState.account = null;
    renderApplication();
  }
}

async function updateOrder(orderId, newStatus) {
  try {
    const updateResult = await apiRequest(
      `orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      },
    );
    const orderIndex = appState.orders.findIndex(
      (order) => order.id === orderId,
    );

    if (orderIndex !== -1) {
      appState.orders[orderIndex] = {
        ...updateResult.order,
        d: formatOrderDate(updateResult.order.pickupDate),
      };
    }

    showToast("Zapisano status zamówienia.");
    renderApplication();
  } catch (error) {
    console.error("Nie udało się zapisać statusu zamówienia.", error);
    showToast(error.message);
  }
}

async function cancelOrder(orderId, cancellationReason) {
  try {
    const cancellationResult = await apiRequest(
      `orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason: cancellationReason }),
      },
    );
    const orderIndex = appState.orders.findIndex(
      (order) => order.id === orderId,
    );

    if (orderIndex !== -1) {
      appState.orders[orderIndex] = {
        ...cancellationResult.order,
        d: formatOrderDate(cancellationResult.order.pickupDate),
      };
    }

    appState.sel = null;
    showToast("Zamówienie anulowane.");
    renderApplication();
  } catch (error) {
    console.error("Nie udało się anulować zamówienia.", error);
    showToast(error.message);
  }
}

async function createProduct(productData) {
  const createResult = await apiRequest("products", {
    method: "POST",
    body: JSON.stringify(productData),
  });

  products.push(createResult.product);
  appState.edit = createResult.product.id;
  showToast("Dodano produkt do bazy.");
  renderApplication();
}

async function updateProduct(productData) {
  const updateResult = await apiRequest(`products/${productData.id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
  const productIndex = products.findIndex(
    (product) => product.id === updateResult.product.id,
  );

  if (productIndex !== -1) {
    products[productIndex] = updateResult.product;
  }

  showToast("Zapisano produkt w bazie.");
  renderApplication();
}
