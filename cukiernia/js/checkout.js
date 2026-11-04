const PICKUP_DAYS = ["Czw", "Pt", "Sob", "Nd", "Pon", "Wt", "Śr"];
const PICKUP_TIME_SLOTS = [
  "10:00–11:00",
  "11:00–12:00",
  "12:00–13:00",
  "13:00–14:00",
];
const CONTACT_FIELDS = [
  ["first-name", "Imię", "Anna"],
  ["last-name", "Nazwisko", "Kowalska"],
  ["email", "Adres e-mail", "anna@example.com"],
  ["phone", "Telefon", "500 600 700"],
];
const PAYMENT_METHODS = [
  ["BLIK", "Kod z aplikacji banku"],
  ["Karta", "Visa, Mastercard"],
  ["Szybki przelew", "Wybierz swój bank"],
];

function renderContactFields() {
  return CONTACT_FIELDS.map(
    ([fieldId, label, defaultValue]) => `
    <div>
      <label class="l" for="${fieldId}">${label} *</label>
      <input class="in w" id="${fieldId}" value="${defaultValue}">
      <div class="err" id="error-${fieldId}"></div>
    </div>`,
  ).join("");
}

function renderPickupOptions() {
  const dayButtons = PICKUP_DAYS.map((dayName, dayIndex) => {
    const calendarDay = dayIndex + 5;
    const isSelected = appState.date === calendarDay;
    const isClosed = dayIndex === 3 || dayIndex === 4;

    return `<button class="d ${isSelected ? "on" : ""}" data-a="day" data-v="${calendarDay}" ${isClosed ? "disabled" : ""}>${dayName}<b>${calendarDay}</b></button>`;
  }).join("");
  const timeButtons = PICKUP_TIME_SLOTS.map(
    (timeSlot) => `
    <button class="d ${appState.slot === timeSlot ? "on" : ""}" data-a="slot" data-v="${timeSlot}">${timeSlot}</button>`,
  ).join("");
  const pickupSummary =
    appState.date && appState.slot
      ? `<small class="accent-text">✓ Wybrano: ${PICKUP_DAYS[appState.date - 5]}, ${appState.date} listopada 2026 · ${appState.slot}</small>`
      : '<small class="err" id="error-pickup"></small>';

  return { dayButtons, timeButtons, pickupSummary };
}

function renderReceiptOptions() {
  const receiptOptions = ["Paragon e-mailem", "Faktura VAT"]
    .map(
      (receiptType) => `
    <label><input type="radio" name="doc" value="${receiptType}" ${appState.doc === receiptType ? "checked" : ""}> ${receiptType}</label>`,
    )
    .join("");
  const invoiceFields =
    appState.doc === "Faktura VAT"
      ? '<div class="f2"><input class="in" placeholder="Nazwa firmy"><input class="in" placeholder="NIP"></div>'
      : "";

  return { receiptOptions, invoiceFields };
}

function renderPaymentOptions() {
  return PAYMENT_METHODS.map(
    ([methodName, description]) => `
    <label><input type="radio" name="pay" value="${methodName}" ${appState.pay === methodName ? "checked" : ""}><b>${methodName}</b><br><small class="muted">${description}</small></label>`,
  ).join("");
}

function renderCheckoutPage() {
  if (!appState.cart.length) {
    location.href = "koszyk.html";
    return "";
  }

  const pageRoot = createTemplateRoot("checkout-page-template");
  const pickupOptions = renderPickupOptions();
  const receiptOptions = renderReceiptOptions();

  pageRoot.querySelector("[data-contact-fields]").innerHTML =
    renderContactFields();
  pageRoot.querySelector("[data-pickup-days]").innerHTML =
    pickupOptions.dayButtons;
  pageRoot.querySelector("[data-pickup-times]").innerHTML =
    pickupOptions.timeButtons;
  pageRoot.querySelector("[data-pickup-summary]").innerHTML =
    pickupOptions.pickupSummary;
  pageRoot.querySelector("[data-receipt-options]").innerHTML =
    receiptOptions.receiptOptions;
  pageRoot.querySelector("[data-invoice-fields]").innerHTML =
    receiptOptions.invoiceFields;
  pageRoot.querySelector("[data-payment-options]").innerHTML =
    renderPaymentOptions();
  pageRoot.querySelector("[data-order-summary]").innerHTML =
    renderOrderSummary(false);
  pageRoot.querySelector("[data-pickup-plan]").innerHTML =
    appState.date && appState.slot
      ? `<div class="card pickup-plan"><b>Twój słodki plan</b><br>${appState.date} listopada 2026, ${appState.slot} · ul. Słodka 12, Kraków</div>`
      : "";

  return renderHeader(true) + pageRoot.innerHTML + renderFooter();
}
