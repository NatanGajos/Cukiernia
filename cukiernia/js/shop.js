const PRODUCT_CATEGORIES = ["Wszystkie", "Torty", "Serniki", "Tarty"];
const PRICE_FILTERS = {
  low: (price) => price < 130,
  high: (price) => price >= 130,
};

function renderProductCard(product) {
  const cardRoot = createTemplateRoot("product-card-template");
  const isFavorite = appState.fav.includes(product.id);
  const productLink = `produkt.html?id=${product.id}`;

  cardRoot.querySelectorAll("[data-product-link]").forEach((link) => {
    link.href = productLink;
  });
  cardRoot.querySelector("[data-product-image]").outerHTML =
    renderProductImage(product);
  cardRoot.querySelector("[data-product-tag]").textContent = product.tag;
  cardRoot.querySelector("[data-product-name]").textContent = product.name;
  cardRoot.querySelector("[data-product-size]").textContent = product.size;
  cardRoot.querySelector("[data-product-price]").textContent = formatPrice(
    product.price,
  );
  cardRoot.querySelector('[data-a="fav"]').dataset.id = product.id;
  cardRoot.querySelector('[data-a="fav"]').textContent = isFavorite ? "♥" : "♡";
  cardRoot
    .querySelector('[data-a="fav"]')
    .setAttribute("aria-pressed", isFavorite);
  cardRoot.querySelector('[data-a="add"]').dataset.id = product.id;

  return cardRoot.innerHTML;
}

function getFilteredProducts() {
  const searchPhrase = appState.q.trim().toLowerCase();
  const priceFilter = PRICE_FILTERS[appState.pr];

  return products.filter((product) => {
    const matchesCategory =
      appState.cat === "Wszystkie" || product.cat === appState.cat;
    const matchesSearch = product.name.toLowerCase().includes(searchPhrase);
    const matchesPrice = !priceFilter || priceFilter(product.price);

    return matchesCategory && matchesSearch && matchesPrice;
  });
}

function renderProductGrid() {
  const matchingProducts = getFilteredProducts();

  return matchingProducts.length
    ? matchingProducts.map(renderProductCard).join("")
    : '<p class="empty-grid">Nic nie znaleźliśmy. Spróbuj innej nazwy lub wyczyść filtry.</p>';
}

function renderCategoryFilters() {
  return PRODUCT_CATEGORIES.map(
    (category) => `
    <button class="chip ${appState.cat === category ? "on" : ""}" data-a="cat" data-v="${category}">${category}</button>`,
  ).join("");
}

function renderReviews() {
  const reviews = [
    [
      "Anna",
      "Lekki krem i wiśnie, które przełamują słodycz. Tort zniknął do ostatniego okruszka.",
      "Tort waniliowy z wiśnią",
    ],
    [
      "Michał",
      "Kremowy środek, pięknie przypieczona góra. Tak właśnie powinien smakować sernik.",
      "Sernik baskijski",
    ],
    [
      "Zofia",
      "Odbiór punktualnie, wszystko pięknie zapakowane. Mały rytuał na wielką okazję.",
      "Tarta jabłkowa",
    ],
  ];

  return reviews
    .map(
      ([author, text, productName]) =>
        `<blockquote><span class="st">★★★★★</span><q>„${text}”</q><small>${author} · ${productName}</small></blockquote>`,
    )
    .join("");
}

function renderHomePage() {
  const pageRoot = createTemplateRoot("home-page-template");

  pageRoot.querySelector("[data-products-count]").textContent = products.length;
  pageRoot.querySelector("[data-category-filters]").innerHTML =
    renderCategoryFilters();
  pageRoot.querySelector("#q").setAttribute("value", appState.q);
  pageRoot.querySelectorAll("#pr option").forEach((option) => {
    option.toggleAttribute("selected", option.value === appState.pr);
  });
  pageRoot.querySelector("#grid").innerHTML = renderProductGrid();
  pageRoot.querySelector("[data-review-list]").innerHTML = renderReviews();

  return renderHeader() + pageRoot.innerHTML + renderFooter();
}

function setProductText(pageRoot, selector, value) {
  pageRoot.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function renderProductPage(productId) {
  const product = findProductById(productId);

  if (!product) return renderHomePage();

  const pageRoot = createTemplateRoot("product-page-template");
  const cakeMessage = appState.n ?? "Sto lat!";
  const isFavorite = appState.fav.includes(product.id);
  const productImageStyle = `--c1:${product.c[0]};--c2:${product.c[1]}`;

  setProductText(pageRoot, "[data-product-category]", product.cat);
  setProductText(pageRoot, "[data-product-name]", product.name);
  setProductText(pageRoot, "[data-product-price]", formatPrice(product.price));
  setProductText(pageRoot, "[data-product-size]", product.size);
  setProductText(pageRoot, "[data-product-color]", product.col);
  setProductText(pageRoot, "[data-product-description]", product.desc);
  setProductText(pageRoot, "[data-product-ingredients]", product.ing);
  setProductText(pageRoot, "[data-product-allergens]", product.al.join(", "));
  pageRoot.querySelector("[data-product-tag]").textContent = product.tag;
  pageRoot.querySelector("[data-product-image]").style.cssText =
    productImageStyle;
  pageRoot.querySelector("[data-product-image]").prepend(product.e);
  pageRoot.querySelector("[data-product-thumbnail-one]").style.cssText =
    `--c1:${product.c[1]};--c2:${product.c[0]}`;
  pageRoot.querySelector("[data-product-thumbnail-two]").style.cssText =
    `--c1:${product.c[0]};--c2:#fff`;
  pageRoot.querySelector("#ins").setAttribute("value", cakeMessage);
  pageRoot.querySelector("#cn").textContent = cakeMessage.length;
  pageRoot.querySelector('[data-a="addp"]').dataset.id = product.id;

  const favoriteButton = pageRoot.querySelector("[data-product-id]");
  favoriteButton.dataset.id = product.id;
  favoriteButton.textContent = isFavorite
    ? "♥ Zapisano"
    : "♡ Zapisz na później";

  return renderHeader() + pageRoot.innerHTML + renderFooter();
}

function renderCartItem(cartItem, cartIndex) {
  const itemRoot = createTemplateRoot("cart-item-template");
  const product = findProductById(cartItem.id);
  const productLink = `produkt.html?id=${product.id}`;
  const message = cartItem.n
    ? `Napis: „${escapeHtml(cartItem.n)}” · bez dopłaty`
    : `${formatPrice(product.price)} / szt.`;

  itemRoot.querySelector("[data-product-link]").href = productLink;
  itemRoot.querySelector("[data-product-image]").outerHTML =
    renderProductImage(product);
  itemRoot.querySelector("[data-product-name]").textContent = product.name;
  itemRoot.querySelector("[data-product-details]").textContent =
    `${product.size} · ${product.col}`;
  itemRoot.querySelector("[data-cart-message]").textContent = message;
  itemRoot.querySelector("[data-cart-message]").className = "accent-text";
  itemRoot.querySelector("[data-cart-quantity]").textContent = cartItem.q;
  itemRoot.querySelector("[data-cart-total]").textContent = formatPrice(
    product.price * cartItem.q,
  );
  itemRoot.querySelectorAll('[data-a="cq"]').forEach((button) => {
    button.dataset.i = cartIndex;
  });
  itemRoot.querySelector('[data-a="rm"]').dataset.i = cartIndex;

  return itemRoot.innerHTML;
}

function renderOrderSummary(showCartDetails) {
  const summaryRoot = createTemplateRoot("order-summary-template");
  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount();
  const total = subtotal - discount;
  const cartDetails = showCartDetails
    ? appState.cart
        .map(
          (cartItem) =>
            `<div><span>${cartItem.q} × ${escapeHtml(findProductById(cartItem.id).name)}</span><span>${formatPrice(findProductById(cartItem.id).price * cartItem.q)}</span></div>`,
        )
        .join("")
    : "";

  summaryRoot.querySelector("[data-summary-items]").innerHTML = cartDetails;
  summaryRoot.querySelector("[data-summary-subtotal]").textContent =
    formatPrice(subtotal);
  summaryRoot.querySelector("[data-summary-discount]").innerHTML =
    appState.coupon
      ? `<span>Rabat SŁODKO10 (−10%)</span><span>−${formatPrice(discount)}</span>`
      : "";
  summaryRoot.querySelector("[data-summary-total]").textContent =
    formatPrice(total);
  summaryRoot.querySelector("[data-summary-action]").innerHTML = showCartDetails
    ? '<a class="btn w" href="kasa.html">Przejdź do kasy →</a>'
    : `<button class="btn w" data-a="pay">Zamawiam i płacę · ${formatPrice(total)}</button>`;

  return summaryRoot.innerHTML;
}

function renderCartPage() {
  const pageRoot = createTemplateRoot("cart-page-template");

  if (!appState.cart.length) {
    return (
      renderHeader() +
      createTemplateRoot("empty-cart-template").innerHTML +
      renderFooter()
    );
  }

  pageRoot.querySelector("[data-cart-count-text]").textContent =
    `${appState.cart.length} produkty · ${getCartItemCount()} sztuk`;
  pageRoot.querySelector("[data-cart-items]").innerHTML = appState.cart
    .map(renderCartItem)
    .join("");
  pageRoot
    .querySelector("#cp")
    .setAttribute("value", appState.coupon ? "SŁODKO10" : "");
  pageRoot.querySelector("[data-coupon-status]").innerHTML = appState.coupon
    ? `<small class="accent-text">Rabat 10% na produkty: oszczędzasz ${formatPrice(getDiscountAmount())} <button class="u" data-a="cpx">Usuń kod</button></small>`
    : '<small class="muted">Wpisz SŁODKO10, aby dostać 10% rabatu.</small>';
  pageRoot.querySelector("[data-order-summary]").innerHTML =
    renderOrderSummary(true);

  return renderHeader() + pageRoot.innerHTML + renderFooter();
}
