const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const caseCards = Array.from(document.querySelectorAll(".case-card"));
const caseSearch = document.querySelector("#caseSearch");
const visibleCount = document.querySelector("#visibleCount");
const toast = document.querySelector(".toast");
const siteHeader = document.querySelector(".site-header");
const galleryControls = document.querySelector(".gallery-controls");
const galleryResetAnchor = document.createElement("span");
const caseModal = document.querySelector(".case-modal");
const modalMedia = document.querySelector(".case-modal-media");
const modalMeta = document.querySelector(".case-modal-meta");
const modalTitle = document.querySelector("#caseModalTitle");
const modalDesc = document.querySelector(".case-modal-desc");
const modalUsage = document.querySelector(".case-modal-usage");
const modalBreakdown = document.querySelector(".case-modal-breakdown");
const modalVariables = document.querySelector(".case-modal-variables");
const modalPrompt = document.querySelector(".case-modal-prompt");
const modalCopy = document.querySelector(".case-modal-copy");

let activeFilter = "all";
let toastTimer = 0;
let searchScrollTimer = 0;
let currentModalPrompt = "";

function normalize(value) {
  return value.toLowerCase().trim();
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function cardMatchesFilter(card) {
  if (activeFilter === "all") return true;
  return card.dataset.category === activeFilter;
}

function cardMatchesSearch(card, query) {
  if (!query) return true;
  const searchableText = [
    card.dataset.title,
    card.dataset.tags,
    card.querySelector("code")?.textContent,
    card.textContent
  ].join(" ");
  return normalize(searchableText).includes(query);
}

function renderCases() {
  const query = normalize(caseSearch?.value || "");
  let count = 0;

  caseCards.forEach((card) => {
    const isVisible = cardMatchesFilter(card) && cardMatchesSearch(card, query);
    card.classList.toggle("hidden", !isVisible);
    if (isVisible) count += 1;
  });

  if (visibleCount) {
    visibleCount.textContent = String(count);
  }
}

function updateHeaderHeight() {
  if (!siteHeader) return;
  document.documentElement.style.setProperty("--header-height", `${siteHeader.offsetHeight}px`);
}

function scrollToGalleryControls() {
  if (!galleryControls) return;
  updateHeaderHeight();

  window.requestAnimationFrame(() => {
    const headerHeight = siteHeader?.offsetHeight || 68;
    const anchorTop = galleryResetAnchor.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(0, anchorTop - headerHeight - 12);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  });
}

function renderCasesAndReset() {
  renderCases();
  scrollToGalleryControls();
}

function cloneChildrenInto(target, source) {
  if (!target) return;
  target.replaceChildren();
  if (!source) return;
  Array.from(source.children).forEach((child) => {
    target.appendChild(child.cloneNode(true));
  });
}

function openCaseModal(card) {
  if (!caseModal || !modalMedia || !modalTitle) return;

  currentModalPrompt = card.querySelector("code")?.textContent.trim() || "";
  const metaNumber = card.querySelector(".case-meta span")?.textContent || "";
  const metaCategory = card.querySelector(".case-meta strong")?.textContent || "";
  const title = card.querySelector("h3")?.textContent || card.dataset.title || "案例详情";
  const description = card.querySelector(".case-body > p")?.textContent || "";
  const images = Array.from(card.querySelectorAll(".case-cover img"));
  const promptPanel = card.querySelector(".prompt-panel");

  modalMedia.replaceChildren(...images.map((image) => image.cloneNode(true)));
  if (modalMeta) {
    modalMeta.innerHTML = `<span>${metaNumber}</span><strong>${metaCategory}</strong>`;
  }
  modalTitle.textContent = title;
  if (modalDesc) modalDesc.textContent = description;
  cloneChildrenInto(modalUsage, card.querySelector(".usage-list"));
  cloneChildrenInto(modalBreakdown, card.querySelector(".prompt-breakdown"));
  cloneChildrenInto(modalVariables, card.querySelector(".variables"));
  if (modalPrompt) {
    modalPrompt.replaceChildren(promptPanel ? promptPanel.cloneNode(true) : document.createTextNode(""));
    modalPrompt.querySelector(".prompt-panel")?.classList.add("open");
  }

  caseModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeCaseModal() {
  if (!caseModal) return;
  caseModal.hidden = true;
  document.body.classList.remove("modal-open");
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderCasesAndReset();
  });
});

caseSearch?.addEventListener("input", () => {
  renderCases();
  window.clearTimeout(searchScrollTimer);
  searchScrollTimer = window.setTimeout(scrollToGalleryControls, 120);
});

caseCards.forEach((card) => {
  const cover = card.querySelector(".case-cover");
  const actions = card.querySelector(".case-actions");
  const title = card.querySelector("h3")?.textContent || "案例";
  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "view-detail-button";
  detailButton.textContent = "查看详情";

  cover?.setAttribute("role", "button");
  cover?.setAttribute("tabindex", "0");
  cover?.setAttribute("aria-label", `查看${title}完整图片与 Prompt`);
  cover?.addEventListener("click", () => openCaseModal(card));
  cover?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCaseModal(card);
    }
  });

  detailButton.addEventListener("click", () => openCaseModal(card));
  actions?.prepend(detailButton);
});

caseModal?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.hasAttribute("data-close-modal")) {
    closeCaseModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && caseModal && !caseModal.hidden) {
    closeCaseModal();
  }
});

modalCopy?.addEventListener("click", async () => {
  if (!currentModalPrompt) return;
  let copied = false;
  const modalCodeBlock = modalPrompt?.querySelector("code");

  try {
    await navigator.clipboard.writeText(currentModalPrompt);
    copied = true;
  } catch {
    copied = fallbackCopy(currentModalPrompt, modalCodeBlock);
  }

  modalCopy.classList.add("copied");
  modalCopy.textContent = copied ? "已复制" : "已选中文本";
  showToast(copied ? "已复制 Prompt" : "已选中 Prompt，可手动复制");

  window.setTimeout(() => {
    modalCopy.classList.remove("copied");
    modalCopy.textContent = "复制 Prompt";
  }, 1500);
});

document.querySelectorAll(".prompt-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    const isOpen = panel.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen ? "收起 Prompt" : "展开 Prompt";
  });
});

function selectPromptText(codeBlock) {
  const selection = window.getSelection();
  if (!selection || !codeBlock) return;
  const range = document.createRange();
  range.selectNodeContents(codeBlock);
  selection.removeAllRanges();
  selection.addRange(range);
}

function fallbackCopy(text, codeBlock) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();

  if (!copied) {
    selectPromptText(codeBlock);
  }

  return copied;
}

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const card = button.closest(".case-card, .agent-card");
    const codeBlock = card?.querySelector("code");
    const prompt = codeBlock?.textContent.trim();
    if (!prompt) return;

    let copied = false;
    try {
      await navigator.clipboard.writeText(prompt);
      copied = true;
    } catch {
      copied = fallbackCopy(prompt, codeBlock);
    }

    button.classList.add("copied");
    button.textContent = copied ? "已复制" : "已选中文本";
    showToast(copied ? "已复制 Prompt" : "已选中 Prompt，可手动复制");

    window.setTimeout(() => {
      button.classList.remove("copied");
      button.textContent = "复制 Prompt";
    }, 1500);
  });
});

document.querySelectorAll(".case-cover img, .workflow-shot img").forEach((image) => {
  image.addEventListener("error", () => {
    image.closest(".case-cover, .workflow-shot")?.classList.add("image-load-failed");
  });
});

if (galleryControls) {
  galleryResetAnchor.setAttribute("aria-hidden", "true");
  galleryResetAnchor.className = "gallery-reset-anchor";
  galleryControls.before(galleryResetAnchor);
}

updateHeaderHeight();
window.addEventListener("resize", updateHeaderHeight);
renderCases();
