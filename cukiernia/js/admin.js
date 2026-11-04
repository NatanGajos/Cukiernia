const ADMIN_PRODUCT_CATEGORIES = ["Torty", "Serniki", "Tarty"];

function renderAdminSidebar(activeTab) {
  const sidebarRoot = createTemplateRoot("admin-page-template");
  const ordersButton = sidebarRoot.querySelector("[data-admin-orders]");
  const productsButton = sidebarRoot.querySelector("[data-admin-products]");

  ordersButton.className = activeTab === "orders" ? "on" : "";
  productsButton.className = activeTab === "products" ? "on" : "";
  ordersButton.dataset.a = "go";
  ordersButton.dataset.v = "panel.html";
  productsButton.dataset.a = "go";
  productsButton.dataset.v = "panel.html#asortyment";

  return sidebarRoot.querySelector("aside").outerHTML;
}

function renderAdminProductList(selectedProductId) {
  return products
    .map((product) => {
      const itemRoot = createTemplateRoot("admin-product-list-item-template");
      const productLink = itemRoot.querySelector('[data-a="edit"]');

      productLink.classList.toggle("on", product.id === selectedProductId);
      productLink.dataset.id = product.id;
      itemRoot.querySelector("[data-product-image]").outerHTML =
        renderProductImage(product);
      itemRoot.querySelector("[data-product-name]").textContent = product.name;
      itemRoot.querySelector("[data-product-size]").textContent = product.size;
      itemRoot.querySelector("[data-product-price]").textContent = formatPrice(
        product.price,
      );

      return itemRoot.innerHTML;
    })
    .join("");
}

function renderAdminProductEditor(product) {
  const editorRoot = createTemplateRoot("admin-product-editor-template");
  const categorySelect = editorRoot.querySelector('[name="category"]');

  categorySelect.innerHTML = ADMIN_PRODUCT_CATEGORIES.map(
    (category) =>
      `<option ${product.cat === category ? "selected" : ""}>${category}</option>`,
  ).join("");
  editorRoot.querySelector('[name="name"]').setAttribute("value", product.name);
  editorRoot
    .querySelector('[name="price"]')
    .setAttribute("value", product.price);
  editorRoot.querySelector('[name="size"]').setAttribute("value", product.size);
  editorRoot
    .querySelector('[name="decorationColor"]')
    .setAttribute("value", product.col);
  editorRoot.querySelector('[name="description"]').textContent = product.desc;
  editorRoot.querySelector('[name="ingredients"]').textContent = product.ing;
  editorRoot
    .querySelector('[name="allergens"]')
    .setAttribute("value", product.al.join(", "));

  return editorRoot.innerHTML;
}

function renderProductAdminPage() {
  const selectedProduct = findProductById(appState.edit);
  const pageRoot = createTemplateRoot("admin-products-page-template");

  pageRoot.querySelectorAll("[data-product-count]").forEach((counter) => {
    counter.textContent = products.length;
  });
  pageRoot.querySelector("[data-product-list]").innerHTML =
    renderAdminProductList(selectedProduct.id);
  pageRoot.querySelector("[data-product-editor]").innerHTML =
    renderAdminProductEditor(selectedProduct);

  return pageRoot.innerHTML;
}

function getActiveOrders() {
  return appState.orders.filter(
    (order) => !["Odebrane", "Anulowane"].includes(order.st),
  );
}

function renderAdminOrderList(orderList, searchPhrase) {
  const normalizedSearch = searchPhrase.toLowerCase();
  const matchingOrders = orderList
    .filter((order) =>
      `${order.id}${order.name}`.toLowerCase().includes(normalizedSearch),
    )
    .sort((firstOrder, secondOrder) =>
      `${firstOrder.d}${firstOrder.t}`.localeCompare(
        `${secondOrder.d}${secondOrder.t}`,
      ),
    );

  if (!matchingOrders.length)
    return '<p class="order-list-empty">Brak zamówień pasujących do wyszukiwania.</p>';

  return matchingOrders
    .map((order) => {
      const itemRoot = createTemplateRoot("admin-order-list-item-template");
      const orderButton = itemRoot.querySelector('[data-a="sel"]');

      orderButton.classList.toggle("on", order.id === appState.sel);
      orderButton.dataset.id = order.id;
      itemRoot.querySelector("[data-order-pickup]").textContent =
        `${order.d} · ${order.t}`;
      itemRoot.querySelector("[data-order-number]").textContent =
        `#${order.id}`;
      itemRoot.querySelector("[data-order-name]").textContent = order.name;
      itemRoot.querySelector("[data-order-status]").textContent = order.st;
      itemRoot.querySelector("[data-order-total]").textContent = formatPrice(
        order.total,
      );

      return itemRoot.innerHTML;
    })
    .join("");
}

function renderSelectedOrder(order) {
  if (!order) return "<p>Wybierz zamówienie z listy.</p>";

  const orderRoot = createTemplateRoot("admin-selected-order-template");
  const orderItems = order.items
    .map(([productId, quantity]) => {
      const product = findProductById(productId);
      return `${quantity} × ${escapeHtml(product.name)} · ${formatPrice(product.price * quantity)}`;
    })
    .join("<br>");
  const statusSelect = orderRoot.querySelector("#order-status");

  statusSelect.innerHTML = ORDER_STATUSES.map(
    (status) =>
      `<option ${status === order.st ? "selected" : ""}>${status}</option>`,
  ).join("");
  orderRoot.querySelector("[data-order-number]").textContent = `#${order.id}`;
  orderRoot.querySelector("[data-order-name]").textContent = order.name;
  orderRoot.querySelector("[data-order-pickup]").textContent =
    `${order.d} 2026 ${order.t}`;
  orderRoot.querySelector("[data-order-items]").innerHTML = orderItems;
  orderRoot.querySelector("[data-order-total]").textContent = formatPrice(
    order.total,
  );
  orderRoot.querySelector("[data-order-status]").textContent = order.st;

  return orderRoot.innerHTML;
}

function renderOrderAdminPage() {
  const activeOrders = getActiveOrders();
  const selectedOrder =
    activeOrders.find((order) => order.id === appState.sel) || activeOrders[0];
  const pageRoot = createTemplateRoot("admin-orders-page-template");

  appState.sel = selectedOrder?.id ?? null;

  pageRoot.querySelector("[data-order-count]").textContent =
    activeOrders.length;
  pageRoot.querySelector("[data-preparing-count]").textContent =
    activeOrders.filter((order) => order.st === "W przygotowaniu").length;
  pageRoot.querySelector("[data-paid-count]").textContent = activeOrders.filter(
    (order) => order.st === "Opłacone",
  ).length;
  pageRoot.querySelector("#order-list").innerHTML = renderAdminOrderList(
    activeOrders,
    "",
  );
  pageRoot.querySelector("#order-details").innerHTML =
    renderSelectedOrder(selectedOrder);

  return pageRoot.innerHTML;
}

function renderAdminPage(activeTab) {
  const shellRoot = createTemplateRoot("admin-page-template");
  const pageContent =
    activeTab === "products"
      ? renderProductAdminPage()
      : renderOrderAdminPage();

  shellRoot.querySelector("aside").outerHTML = renderAdminSidebar(activeTab);
  shellRoot.querySelector("[data-admin-content]").innerHTML = pageContent;

  return shellRoot.innerHTML;
}
