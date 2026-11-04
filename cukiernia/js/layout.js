let sharedTemplatesDocument = null;

async function loadSharedTemplates() {
  if (sharedTemplatesDocument) return;

  const response = await fetch("templates.html");
  const templatesMarkup = await response.text();
  sharedTemplatesDocument = new DOMParser().parseFromString(
    templatesMarkup,
    "text/html",
  );
}

function getTemplateMarkup(templateId) {
  const template =
    document.getElementById(templateId) ||
    sharedTemplatesDocument?.getElementById(templateId);

  if (!template) {
    throw new Error(`Brak szablonu HTML: ${templateId}`);
  }

  return template.innerHTML;
}

function createTemplateRoot(templateId) {
  const templateRoot = document.createElement("div");
  templateRoot.innerHTML = getTemplateMarkup(templateId);
  return templateRoot;
}

function renderHeader(isCheckoutPage = false) {
  const headerWrapper = document.createElement("div");
  headerWrapper.innerHTML = getTemplateMarkup("site-header-template");

  headerWrapper.querySelector("[data-header-secure]").style.display =
    isCheckoutPage ? "inline" : "none";
  headerWrapper.querySelector("[data-header-navigation]").style.display =
    isCheckoutPage ? "none" : "";
  headerWrapper.querySelector("[data-header-actions]").style.display =
    isCheckoutPage ? "none" : "";
  headerWrapper.querySelector("[data-cart-count]").textContent =
    getCartItemCount();
  headerWrapper.querySelector("nav").classList.toggle("open", appState.menu);

  return headerWrapper.innerHTML;
}

function renderFooter() {
  return getTemplateMarkup("site-footer-template");
}
