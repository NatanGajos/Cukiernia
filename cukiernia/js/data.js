const querySelector = (selector) => document.querySelector(selector),
  formatPrice = (n) => n.toFixed(2).replace(".", ",") + " zł";
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
const products = [
  {
    id: 1,
    name: "Tort waniliowy z wiśnią",
    cat: "Torty",
    tag: "Na wyjątkowe chwile",
    size: "18 cm · 8–10 porcji",
    price: 180,
    col: "kremowy z wiśnią",
    e: "🎂",
    c: ["#f3e4d0", "#b5483f"],
    desc: "Puszysty biszkopt, krem z prawdziwą wanilią i kwaskowe wiśnie. Delikatny, nieprzesłodzony — gotowy, by świętować z Tobą.",
    ing: "śmietanka 36%, mascarpone, jaja, mąka pszenna, wiśnie 18%, cukier, masło, mleko, wanilia, skrobia ziemniaczana, żelatyna.",
    al: ["gluten (pszenica)", "jaja", "mleko"],
  },
  {
    id: 2,
    name: "Sernik baskijski",
    cat: "Serniki",
    tag: "Ulubieniec pracowni",
    size: "20 cm · 8 porcji",
    price: 120,
    col: "karmelowy",
    e: "🍰",
    c: ["#e8c99a", "#9a5b2e"],
    desc: "Kremowy środek i mocno przypieczona góra. Tak właśnie powinien smakować sernik.",
    ing: "serek śmietankowy, śmietanka, jaja, cukier, mąka, wanilia.",
    al: ["gluten (pszenica)", "jaja", "mleko"],
  },
  {
    id: 3,
    name: "Tort czekoladowy",
    cat: "Torty",
    tag: "Intensywnie czekoladowy",
    size: "18 cm · 8 porcji",
    price: 140,
    col: "czekoladowy",
    e: "🍫",
    c: ["#9c6a4f", "#3b2218"],
    desc: "Wilgotny biszkopt kakaowy i gęsty krem ganache z gorzkiej czekolady.",
    ing: "czekolada gorzka, masło, jaja, cukier, mąka, kakao, śmietanka.",
    al: ["gluten (pszenica)", "jaja", "mleko"],
  },
  {
    id: 4,
    name: "Tarta jabłkowa",
    cat: "Tarty",
    tag: "Smak jesieni",
    size: "24 cm · 8 porcji",
    price: 96,
    col: "złoty",
    e: "🥧",
    c: ["#f0d7a8", "#c98a3d"],
    desc: "Kruche ciasto, jabłka z cynamonem ułożone w różę.",
    ing: "jabłka, mąka, masło, cukier, jaja, cynamon.",
    al: ["gluten (pszenica)", "jaja", "mleko"],
  },
];
const appState = {
  account: null,
  cart: [],
  fav: [],
  coupon: false,
  cat: "Wszystkie",
  q: "",
  pr: "",
  orders: [],
  sel: null,
  edit: 1,
  date: null,
  slot: null,
  doc: "Paragon e-mailem",
  pay: "BLIK",
  menu: 0,
};

const AUTH_TOKEN_STORAGE_KEY = "okruszyna-auth-token";
const CUSTOMER_DATA_STORAGE_KEY = "okruszyna-customer-data-v2";
localStorage.removeItem("ok");
try {
  const savedCustomerData = JSON.parse(
    localStorage.getItem(CUSTOMER_DATA_STORAGE_KEY) || "null",
  );
  if (savedCustomerData) {
    appState.cart = savedCustomerData.cart;
    appState.fav = savedCustomerData.fav;
  }
} catch (e) {}
function saveCustomerData() {
  try {
    localStorage.setItem(
      CUSTOMER_DATA_STORAGE_KEY,
      JSON.stringify({ cart: appState.cart, fav: appState.fav }),
    );
  } catch (error) {
    console.error("Nie udało się zapisać lokalnej kopii koszyka.", error);
  }

  if (!databaseReady) {
    if (databaseError) {
      showToast("Nie zapisano zmian. Sprawdź połączenie z bazą MariaDB.");
    }

    return Promise.resolve();
  }

  return apiRequest("saved", {
    method: "PUT",
    body: JSON.stringify({ cart: appState.cart, fav: appState.fav }),
  }).catch((error) => {
    console.error("Nie udało się zapisać koszyka w MariaDB.", error);
    showToast("Nie udało się zapisać koszyka w bazie MariaDB.");
  });
}
const showToast = (m) => {
  const toastContainer = querySelector("#toast");
  toastContainer.innerHTML = '<div class="toast" role="status">' + m + "</div>";
  setTimeout(() => (toastContainer.innerHTML = ""), 2600);
};
const findProductById = (productId) =>
  products.find((product) => product.id == productId);
const renderProductImage = (product, className = "") =>
  `<span class="ph ${className}" style="--c1:${product.c[0]};--c2:${product.c[1]}"><span class="e">${escapeHtml(product.e)}</span></span>`;
const getCartItemCount = () =>
  appState.cart.reduce((total, cartItem) => total + cartItem.q, 0);
const getCartSubtotal = () =>
  appState.cart.reduce(
    (subtotal, cartItem) =>
      subtotal + findProductById(cartItem.id).price * cartItem.q,
    0,
  );
const getDiscountAmount = () => (appState.coupon ? getCartSubtotal() * 0.1 : 0);
function addToCart(productId, quantity = 1, cakeMessage = "") {
  const existingCartItem = appState.cart.find(
    (cartItem) => cartItem.id == productId,
  );
  existingCartItem
    ? (existingCartItem.q += quantity)
    : appState.cart.push({ id: +productId, q: quantity, n: cakeMessage });
  saveCustomerData();
  showToast("Dodano do koszyka");
  renderApplication();
}
