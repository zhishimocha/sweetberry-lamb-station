const STORAGE_KEY = "sweetberry-lamb-station-links-v1";
const THEME_KEY = "sweetberry-lamb-station-theme-v1";

const defaultLinks = [
  { id: cryptoId(), name: "待办卡片", url: "#", category: "mine", icon: "🐑" },
  { id: cryptoId(), name: "拼豆记", url: "#", category: "mine", icon: "🫙" },
  { id: cryptoId(), name: "地址生成器", url: "#", category: "mine", icon: "✉️" },
  { id: cryptoId(), name: "快递回收", url: "#", category: "mine", icon: "📦" },
  { id: cryptoId(), name: "满满在线", url: "#", category: "mine", icon: "🍓" },
  { id: cryptoId(), name: "未来日历", url: "#", category: "mine", icon: "📅" },
  { id: cryptoId(), name: "GitHub", url: "https://github.com", category: "common", icon: "G" },
  { id: cryptoId(), name: "Vercel", url: "https://vercel.com", category: "common", icon: "V" },
  { id: cryptoId(), name: "Cloudflare", url: "https://dash.cloudflare.com", category: "common", icon: "☁️" },
  { id: cryptoId(), name: "Supabase", url: "https://supabase.com/dashboard", category: "common", icon: "S" },
  { id: cryptoId(), name: "ChatGPT", url: "https://chatgpt.com", category: "common", icon: "AI" }
];

let links = loadLinks();
let editingId = null;

const themes = ["theme-sweet", "theme-cream", "theme-night"];

const els = {
  body: document.body,
  mySites: document.getElementById("mySites"),
  commonSites: document.getElementById("commonSites"),
  search: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  themeBtn: document.getElementById("themeBtn"),
  addBtn: document.getElementById("addBtn"),
  backupBtn: document.getElementById("backupBtn"),
  backupMenu: document.getElementById("backupMenu"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  modal: document.getElementById("linkModal"),
  form: document.getElementById("linkForm"),
  modalTitle: document.getElementById("modalTitle"),
  nameInput: document.getElementById("nameInput"),
  urlInput: document.getElementById("urlInput"),
  categoryInput: document.getElementById("categoryInput"),
  iconInput: document.getElementById("iconInput"),
  cancelBtn: document.getElementById("cancelBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  toast: document.getElementById("toast")
};

init();

function init() {
  applySavedTheme();
  render();

  els.search.addEventListener("input", render);
  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    render();
  });

  els.themeBtn.addEventListener("click", switchTheme);
  els.addBtn.addEventListener("click", () => openModal());
  els.cancelBtn.addEventListener("click", closeModal);
  els.form.addEventListener("submit", saveFromModal);
  els.deleteBtn.addEventListener("click", deleteCurrent);

  els.backupBtn.addEventListener("click", () => {
    els.backupMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!els.backupMenu.contains(e.target) && e.target !== els.backupBtn) {
      els.backupMenu.classList.remove("show");
    }
  });

  els.exportBtn.addEventListener("click", exportBackup);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importBackup);
}

function render() {
  const keyword = els.search.value.trim().toLowerCase();
  els.clearSearch.classList.toggle("show", Boolean(keyword));

  const filtered = links.filter((item) => {
    const text = `${item.name} ${item.url}`.toLowerCase();
    return text.includes(keyword);
  });

  renderGroup(els.mySites, filtered.filter((item) => item.category === "mine"));
  renderGroup(els.commonSites, filtered.filter((item) => item.category === "common"));
  saveLinks();
}

function renderGroup(container, items) {
  container.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "这里暂时空空，点右下角＋添加";
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "shortcut";
    btn.type = "button";
    btn.setAttribute("aria-label", item.name);

    btn.innerHTML = `
      <span class="icon-card">
        <span class="icon bubble">${escapeHtml(item.icon || firstChar(item.name))}</span>
      </span>
      <span class="link-name">${escapeHtml(item.name)}</span>
    `;

    btn.addEventListener("click", () => {
      if (!item.url || item.url === "#") {
        showToast("这个入口还没有填网址");
        return;
      }
      window.open(item.url, "_blank", "noopener,noreferrer");
    });

    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openModal(item);
    });

    let pressTimer = null;
    btn.addEventListener("touchstart", () => {
      pressTimer = setTimeout(() => openModal(item), 520);
    }, { passive: true });
    btn.addEventListener("touchend", () => clearTimeout(pressTimer));
    btn.addEventListener("touchmove", () => clearTimeout(pressTimer));

    container.appendChild(btn);
  });
}

function openModal(item = null) {
  editingId = item?.id || null;
  els.modalTitle.textContent = item ? "编辑网址" : "添加网址";
  els.nameInput.value = item?.name || "";
  els.urlInput.value = item?.url === "#" ? "" : (item?.url || "");
  els.categoryInput.value = item?.category || "mine";
  els.iconInput.value = item?.icon || "";
  els.deleteBtn.classList.toggle("hidden", !item);
  els.modal.showModal();
}

function closeModal() {
  els.modal.close();
  els.form.reset();
  editingId = null;
}

function saveFromModal(e) {
  e.preventDefault();

  const name = els.nameInput.value.trim();
  let url = els.urlInput.value.trim();
  const category = els.categoryInput.value;
  const icon = els.iconInput.value.trim();

  if (!name || !url) return;

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  if (editingId) {
    links = links.map((item) => item.id === editingId ? {
      ...item,
      name,
      url,
      category,
      icon: icon || firstChar(name)
    } : item);
    showToast("已更新");
  } else {
    links.push({
      id: cryptoId(),
      name,
      url,
      category,
      icon: icon || firstChar(name)
    });
    showToast("已添加");
  }

  saveLinks();
  render();
  closeModal();
}

function deleteCurrent() {
  if (!editingId) return;
  links = links.filter((item) => item.id !== editingId);
  saveLinks();
  render();
  closeModal();
  showToast("已删除");
}

function switchTheme() {
  const current = themes.findIndex((t) => els.body.classList.contains(t));
  const next = themes[(current + 1) % themes.length];

  themes.forEach((t) => els.body.classList.remove(t));
  els.body.classList.add(next);
  localStorage.setItem(THEME_KEY, next);

  const names = {
    "theme-sweet": "甜莓绵羊风",
    "theme-cream": "奶油黄油风",
    "theme-night": "夜间软糖风"
  };
  showToast(`已切换：${names[next]}`);
}

function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (!saved || !themes.includes(saved)) return;
  themes.forEach((t) => els.body.classList.remove(t));
  els.body.classList.add(saved);
}

function exportBackup() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: themes.find((t) => els.body.classList.contains(t)) || "theme-sweet",
    links
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `甜莓绵羊站备份-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  els.backupMenu.classList.remove("show");
  showToast("备份已导出");
}

function importBackup(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.links)) throw new Error("invalid");

      links = data.links.map((item) => ({
        id: item.id || cryptoId(),
        name: String(item.name || "未命名"),
        url: String(item.url || "#"),
        category: item.category === "common" ? "common" : "mine",
        icon: String(item.icon || firstChar(item.name || "站")).slice(0, 2)
      }));

      if (data.theme && themes.includes(data.theme)) {
        themes.forEach((t) => els.body.classList.remove(t));
        els.body.classList.add(data.theme);
        localStorage.setItem(THEME_KEY, data.theme);
      }

      saveLinks();
      render();
      showToast("导入成功");
    } catch {
      showToast("导入失败，文件格式不对");
    } finally {
      els.importFile.value = "";
      els.backupMenu.classList.remove("show");
    }
  };
  reader.readAsText(file);
}

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLinks;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultLinks;
  } catch {
    return defaultLinks;
  }
}

function saveLinks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function cryptoId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function firstChar(text) {
  return String(text || "站").trim().slice(0, 1).toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer = null;
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}
