function renderApplication() {
  const pageType = document.body.dataset.page || "home";
  const currentPath = location.hash.replace("#/", "").split("#")[0];
  const [hashRouteName, hashRouteParameter] = currentPath.split("/");
  const pageRoutes = {
    product: "produkt",
    cart: "koszyk",
    checkout: "kasa",
    account: "konto",
    admin: "panel",
  };
  const routeName = pageType === "home" ? hashRouteName : pageRoutes[pageType];
  const routeParameter =
    pageType === "product"
      ? new URLSearchParams(location.search).get("id")
      : hashRouteParameter;
  const focusedElementId = document.activeElement?.id;

  if (routeName === "panel" && appState.account?.role !== "admin") {
    location.href = "konto.html";
    return;
  }

  querySelector("#app").innerHTML =
    routeName == "produkt"
      ? renderProductPage(routeParameter)
      : routeName == "koszyk"
        ? renderCartPage()
        : routeName == "kasa"
          ? renderCheckoutPage()
          : routeName == "konto"
            ? account()
            : routeName == "panel"
              ? renderAdminPage(
                  location.hash.includes("asortyment") ? "products" : "orders",
                )
              : renderHomePage();
  if (
    focusedElementId &&
    querySelector("#" + focusedElementId) &&
    ["q", "order-search"].includes(focusedElementId)
  ) {
    const focusedElement = querySelector("#" + focusedElementId);
    focusedElement.focus();
    focusedElement.setSelectionRange(
      focusedElement.value.length,
      focusedElement.value.length,
    );
  }
}
addEventListener("hashchange", () => {
  appState.menu = 0;
  const anchorId = location.hash.split("#")[2];
  renderApplication();
  if (anchorId) querySelector("#" + anchorId)?.scrollIntoView();
  else if (!location.hash.includes("#/#")) scrollTo(0, 0);
});
document.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-a]");
  if (!actionElement) {
    if (event.target.closest("nav a")) {
      appState.menu = 0;
    }
    return;
  }
  const actionName = actionElement.dataset.a;
  const actionData = actionElement.dataset;
  if (actionName == "menu") {
    appState.menu = !appState.menu;
    return renderApplication();
  }
  if (actionName == "search") {
    location.href = "index.html#/#wypieki";
    setTimeout(() => {
      querySelector("#q")?.focus();
      querySelector("#wypieki")?.scrollIntoView();
    }, 50);
    return;
  }
  if (actionName == "favs") {
    location.href = "konto.html#zyczen";
    setTimeout(() => querySelector("#zyczen")?.scrollIntoView(), 60);
    return;
  }
  if (actionName == "fav") {
    const productId = +actionData.id;
    appState.fav = appState.fav.includes(productId)
      ? appState.fav.filter((favoriteId) => favoriteId != productId)
      : [...appState.fav, productId];
    saveCustomerData();
    return renderApplication();
  }
  if (actionName == "cat") {
    appState.cat = actionData.v;
    return renderApplication();
  }
  if (actionName == "add" || actionName == "re")
    return addToCart(actionData.id);
  if (actionName == "dq" || actionName == "uq") {
    const quantity = Math.max(
      1,
      +querySelector("#pq").textContent + (actionName == "uq" ? 1 : -1),
    );
    querySelector("#pq").textContent = quantity;
    const productId =
      new URLSearchParams(location.search).get("id") ||
      location.hash.split("/")[2];
    querySelector("#pt").textContent = formatPrice(
      quantity * findProductById(productId).price,
    );
    return;
  }
  if (actionName == "addp") {
    const quantity = +querySelector("#pq").textContent;
    appState.n = querySelector("#ins").value;
    addToCart(actionData.id, quantity, appState.n);
    appState.n = undefined;
    return;
  }
  if (actionName == "rv")
    return showToast("Opinie dodasz po zalogowaniu (wersja demonstracyjna)");
  if (actionName == "cq") {
    const cartItem = appState.cart[actionData.i];
    cartItem.q = Math.max(1, cartItem.q + +actionData.d);
    saveCustomerData();
    return renderApplication();
  }
  if (actionName == "rm") {
    appState.cart.splice(actionData.i, 1);
    saveCustomerData();
    return renderApplication();
  }
  if (actionName == "cpn") {
    const couponCode = querySelector("#cp").value.trim().toUpperCase();
    if (couponCode == "SŁODKO10" || couponCode == "SLODKO10") {
      appState.coupon = 1;
      showToast("Rabat zastosowany");
    } else showToast("Nieznany kod rabatowy");
    return renderApplication();
  }
  if (actionName == "cpx") {
    appState.coupon = 0;
    return renderApplication();
  }
  if (actionName == "day") {
    appState.date = +actionData.v;
    return renderApplication();
  }
  if (actionName == "slot") {
    appState.slot = actionData.v;
    return renderApplication();
  }
  if (actionName == "pay") return submitOrder();
  if (actionName == "go") {
    if (actionData.v.includes(".html")) {
      location.href = actionData.v;
    } else {
      location.hash = actionData.v;
    }
    return;
  }
  if (actionName == "cal" || actionName == "dat" || actionName == "par")
    return showToast("Ta sekcja nie jest częścią makiety");
  if (actionName == "out") {
    return logoutAccount().then(() => {
      location.href = "index.html";
      showToast("Wylogowano");
    });
  }
  if (actionName == "sel") {
    appState.sel = actionData.id;
    return renderApplication();
  }
  if (actionName == "ssv") {
    const selectedOrder = appState.orders.find(
      (order) => order.id === appState.sel,
    );
    return updateOrder(selectedOrder.id, querySelector("#order-status").value);
  }
  if (actionName == "cx") {
    const cancellationReason = querySelector(
      "#cancellation-reason",
    ).value.trim();
    if (cancellationReason.length < 5) {
      querySelector("#error-cancellation-reason").textContent =
        "Podaj powód anulowania (min. 5 znaków).";
      return;
    }
    return cancelOrder(appState.sel, cancellationReason);
  }
  if (actionName == "edit") {
    appState.edit = +actionData.id;
    return renderApplication();
  }
  if (actionName == "cancel") return renderApplication();
  if (actionName == "newp") {
    createProduct({
      name: "Nowy wypiek",
      cat: "Torty",
      tag: "Nowość",
      size: "18 cm · 8 porcji",
      price: 100,
      col: "naturalny",
      e: "🧁",
      c: ["#f3e4d0", "#c9a283"],
      desc: "",
      ing: "",
      al: [],
    }).catch((error) => {
      console.error("Nie udało się dodać produktu.", error);
      showToast(error.message);
    });
    return;
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id == "q") {
    appState.q = t.value;
    querySelector("#grid").innerHTML = renderProductGrid();
  }
  if (t.id == "pr") {
    appState.pr = t.value;
    querySelector("#grid").innerHTML = renderProductGrid();
  }
  if (t.id == "ins") querySelector("#cn").textContent = t.value.length;
  if (t.id == "order-search") {
    querySelector("#order-list").innerHTML = renderOrderList(
      appState.orders.filter(
        (order) => !["Odebrane", "Anulowane"].includes(order.st),
      ),
      t.value,
    );
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.name == "doc") {
    appState.doc = t.value;
    renderApplication();
  }
  if (t.name == "pay") appState.pay = t.value;
  if (t.id == "pr") {
    appState.pr = t.value;
    querySelector("#grid").innerHTML = renderProductGrid();
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id == "account-form") {
    e.preventDefault();
    const submitter = e.submitter;
    const errorElement = querySelector("#account-error");
    const name = querySelector("#account-name").value.trim();
    const email = querySelector("#account-email").value.trim();
    const password = querySelector("#account-password").value;

    if (submitter?.dataset.mode === "register" && name.length < 2) {
      errorElement.textContent = "Podaj imię i nazwisko.";
      return;
    }

    if (password.length < 8) {
      errorElement.textContent = "Hasło musi mieć co najmniej 8 znaków.";
      return;
    }

    errorElement.textContent = "";
    authenticateAccount(submitter.dataset.mode, {
      name,
      email,
      password,
    }).catch((error) => {
      errorElement.textContent = error.message;
    });
    return;
  }

  if (e.target.id != "product-form") return;
  e.preventDefault();
  const formData = new FormData(e.target);
  const selectedProduct = findProductById(appState.edit);
  updateProduct({
    ...selectedProduct,
    name: formData.get("name"),
    cat: formData.get("category"),
    price: Number(formData.get("price")),
    size: formData.get("size"),
    col: formData.get("decorationColor"),
    desc: formData.get("description"),
    ing: formData.get("ingredients"),
    al: formData
      .get("allergens")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  }).catch((error) => {
    console.error("Nie udało się zapisać produktu.", error);
    showToast(error.message);
  });
});
function submitOrder() {
  let isValid = true;
  const setFieldError = (fieldId, message) => {
    const errorElement = querySelector(`#error-${fieldId}`);
    const inputElement = querySelector(`#${fieldId}`);

    if (errorElement) errorElement.textContent = message;
    if (inputElement) inputElement.classList.toggle("bad", Boolean(message));
    if (message) isValid = false;
  };

  const firstName = querySelector("#first-name").value.trim();
  const lastName = querySelector("#last-name").value.trim();
  const email = querySelector("#email").value.trim();
  const phone = querySelector("#phone").value.trim();
  const termsAccepted = querySelector("#terms").checked;

  setFieldError("first-name", firstName ? "" : "Uzupełnij to pole.");
  setFieldError("last-name", lastName ? "" : "Uzupełnij to pole.");
  setFieldError(
    "email",
    /^\S+@\S+\.\S+$/.test(email) ? "" : "Podaj poprawny adres e-mail.",
  );
  setFieldError(
    "phone",
    /^[\d\s+]{9,}$/.test(phone) ? "" : "Podaj numer telefonu (min. 9 cyfr).",
  );
  setFieldError(
    "pickup",
    appState.date && appState.slot ? "" : "Wybierz dzień i godzinę odbioru.",
  );
  setFieldError(
    "terms",
    termsAccepted ? "" : "Zaakceptuj regulamin, aby złożyć zamówienie.",
  );

  if (!isValid) {
    showToast("Sprawdź zaznaczone pola");
    return;
  }
  apiRequest("orders", {
    method: "POST",
    body: JSON.stringify({
      name: `${firstName} ${lastName}`,
      email,
      phone,
      pickupDate: `2026-11-${String(appState.date).padStart(2, "0")}`,
      pickupTime: appState.slot.slice(0, 5),
      receipt: appState.doc,
      payment: appState.pay,
      coupon: appState.coupon,
      termsAccepted,
    }),
  })
    .then(({ order }) => {
      appState.orders.unshift({
        ...order,
        d: formatOrderDate(order.pickupDate),
      });
      appState.cart = [];
      appState.date = appState.slot = null;
      try {
        localStorage.setItem(
          CUSTOMER_DATA_STORAGE_KEY,
          JSON.stringify({ cart: appState.cart, fav: appState.fav }),
        );
      } catch (error) {
        console.error("Nie udało się zapisać lokalnej kopii koszyka.", error);
      }

      showToast("Dziękujemy! Zamówienie #" + order.id + " przyjęte");
      location.href = "konto.html";
    })
    .catch((error) => {
      console.error("Nie udało się złożyć zamówienia.", error);
      showToast(error.message);
    });
}

loadSharedTemplates()
  .then(initializeDatabase)
  .then(renderApplication)
  .catch((error) => {
    databaseError = true;
    console.error("Nie udało się połączyć z MariaDB.", error);
    renderApplication();
    showToast(error.message);
  });
