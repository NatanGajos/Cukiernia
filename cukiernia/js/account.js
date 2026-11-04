const ORDER_STATUSES = [
  "Przyjęte",
  "Opłacone",
  "W przygotowaniu",
  "Gotowe do odbioru",
  "Odebrane",
];

function renderOrderItems(order) {
  return order.items
    .map((orderItem) => {
      const product = findProductById(orderItem[0]);
      return `${orderItem[1]} × ${escapeHtml(product.name)} · ${formatPrice(product.price * orderItem[1])}`;
    })
    .join("<br>");
}

function renderOrderTimeline(status) {
  const activeStatusIndex = Math.max(ORDER_STATUSES.indexOf(status), 1);

  return ORDER_STATUSES.map((orderStatus, statusIndex) => {
    const marker =
      statusIndex < activeStatusIndex
        ? "✓"
        : statusIndex === activeStatusIndex
          ? "●"
          : "○";
    return `<span class="${statusIndex === activeStatusIndex ? "on" : ""}">${marker} ${orderStatus}</span>`;
  }).join("");
}

function renderActiveOrder(order) {
  const orderRoot = createTemplateRoot("active-order-template");
  const pickupTime = order.t ? ` · ${order.t}` : "";

  orderRoot.querySelector("[data-order-number]").textContent = `#${order.id}`;
  orderRoot.querySelector("[data-order-date]").textContent = order.d;
  orderRoot.querySelector("[data-order-status]").textContent = order.st;
  orderRoot.querySelector("[data-order-total]").textContent = formatPrice(
    order.total,
  );
  orderRoot.querySelector("[data-order-timeline]").innerHTML =
    renderOrderTimeline(order.st);
  orderRoot.querySelector("[data-order-items]").innerHTML =
    renderOrderItems(order);
  orderRoot.querySelector("[data-order-note]").innerHTML = order.note
    ? `<br><small>Napis: „${escapeHtml(order.note)}”</small>`
    : "";
  orderRoot.querySelector("[data-order-pickup-date]").textContent = order.d;
  orderRoot.querySelector("[data-order-pickup-time]").textContent = pickupTime;

  return orderRoot.innerHTML;
}

function renderArchivedOrder(order) {
  const orderRoot = createTemplateRoot("archived-order-template");
  const productNames = order.items
    .map((item) => escapeHtml(findProductById(item[0]).name))
    .join(", ");
  const reorderButton = orderRoot.querySelector("[data-order-reorder]");

  orderRoot.querySelector("[data-order-number]").textContent =
    `#${order.id} · ${productNames}`;
  orderRoot.querySelector("[data-order-date]").textContent = `${order.d} 2026`;
  orderRoot.querySelector("[data-order-status]").textContent = order.st;
  orderRoot.querySelector("[data-order-total]").textContent = formatPrice(
    order.total,
  );
  orderRoot.querySelector("[data-order-reason]").textContent = order.why
    ? `Powód: ${order.why}`
    : "";
  reorderButton.hidden = order.st !== "Odebrane";
  reorderButton.dataset.id = order.items[0]?.[0] ?? "";

  return orderRoot.innerHTML;
}

function renderFavoriteProduct(productId) {
  const productRoot = createTemplateRoot("favorite-product-template");
  const product = findProductById(productId);

  productRoot.querySelector("[data-product-image]").outerHTML =
    renderProductImage(product);
  productRoot.querySelector("[data-product-name]").textContent = product.name;
  productRoot.querySelector("[data-product-price]").textContent = formatPrice(
    product.price,
  );
  productRoot.querySelector('[data-a="add"]').dataset.id = product.id;
  productRoot.querySelector('[data-a="fav"]').dataset.id = product.id;

  return productRoot.innerHTML;
}

function renderAccountPage() {
  if (!appState.account) {
    return (
      renderHeader() +
      createTemplateRoot("account-auth-template").innerHTML +
      renderFooter()
    );
  }

  const pageRoot = createTemplateRoot("account-page-template");
  const accountOrders = appState.orders.filter((order) => order.mine);
  const activeOrders = accountOrders.filter(
    (order) => !["Odebrane", "Anulowane"].includes(order.st),
  );
  const archivedOrders = accountOrders.filter(
    (order) => !activeOrders.includes(order),
  );
  const firstName = appState.account.name.split(" ")[0];

  pageRoot.querySelector("[data-account-initials]").textContent =
    appState.account.name.slice(0, 2).toUpperCase();
  pageRoot.querySelector("[data-account-name]").textContent =
    appState.account.name;
  pageRoot.querySelector("[data-account-email]").textContent =
    appState.account.email;
  pageRoot.querySelector("[data-account-first-name]").textContent = firstName;
  pageRoot.querySelector("[data-favorite-count]").textContent =
    appState.fav.length;
  pageRoot.querySelector("[data-active-orders]").innerHTML = activeOrders
    .map(renderActiveOrder)
    .join("");
  pageRoot.querySelector("[data-archived-orders]").innerHTML = archivedOrders
    .map(renderArchivedOrder)
    .join("");
  pageRoot.querySelector("[data-favorite-products]").innerHTML = appState.fav
    .length
    ? appState.fav.map(renderFavoriteProduct).join("")
    : "<p>Lista jest pusta. Kliknij ♡ przy wypieku, który Cię kusi.</p>";

  return renderHeader() + pageRoot.innerHTML + renderFooter();
}

function account() {
  return renderAccountPage();
}
