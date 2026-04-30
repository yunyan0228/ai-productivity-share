const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const caseCards = Array.from(document.querySelectorAll(".case-card"));
const caseSearch = document.querySelector("#caseSearch");
const visibleCount = document.querySelector("#visibleCount");
const toast = document.querySelector(".toast");

let activeFilter = "all";
let toastTimer = 0;

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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderCases();
  });
});

caseSearch?.addEventListener("input", renderCases);

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

renderCases();
