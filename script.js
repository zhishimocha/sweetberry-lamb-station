const STORAGE_KEY = "mamm_transfer_station_sites_v1";
const THEME_KEY = "mamm_transfer_station_theme_v1";

const DEFAULT_SITES = [
  { id: cryptoId(), name: "待办卡片", url: "#", category: "mine", icon: "待" },
  { id: cryptoId(), name: "拼豆记", url: "#", category: "mine", icon: "豆" },
  { id: cryptoId(), name: "地址生成器", url: "#", category: "mine", icon: "信" },
  { id: cryptoId(), name: "快递回收", url: "#", category: "mine", icon: "箱" },
  { id: cryptoId(), name: "满满在线", url: "#", category: "mine", icon: "满" },
  { id: cryptoId(), name: "未来日历", url: "#", category: "mine", icon: "历" },
  { id: cryptoId(), name: "GitHub", url: "https://github.com/", category: "common", icon: "G" },
  { id: cryptoId(), name: "Vercel", url: "https://vercel.com/", category: "common", icon: "V" },
  { id: cryptoId(), name: "Cloudflare", url: "https://dash.cloudflare.com/", category: "common", icon: "云" },
  { id: cryptoId(), name: "Supabase", url: "https://supabase.com/dashboard", category: "common", icon: "S" },
  { id: cryptoId(), name: "ChatGPT", url: "https://chat.openai.com/", category: "common", icon: "AI" }
];

const THEMES = ["theme-lamb", "theme-butter", "theme-night"];
let sites = loadSites();
let editingId = null;

const els = {
  mySitesTrack: document.getElementById("mySitesTrack"),
  commonSitesTrack: document.getElementById("commonSitesTrack"),
  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  themeBtn: document.getElementById("themeBtn"),
  addBtn: document.getElementById("addBtn"),
  backupBtn: document.getElementById("backupBtn"),
  backupMenu: document.getElementById("backupMenu"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  modalMask: document.getElementById("modalMask"),
  siteForm: document.getElementById("siteForm"),
  modalTitle: document.getElementById("modalTitle"),
  nameInput: document.getElementById("nameInput"),
  urlInput: document.getElementById("urlInput"),
  categoryInput: document.getElementById("categoryInput"),
  iconInput: document.getElementById("iconInput"),
  cancelBtn: document.getElementById("cancelBtn")
};

initTheme();
render();

els.searchInput.addEventListener("input", render);
els.clearSearch.addEventListener("click", () => {
  els.searchInput.value = "";
  render();
});

els.themeBtn.addEventListener("click", () => {
  const current = THEMES.find(t => document.body.classList.contains(t)) || THEMES[0];
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  document.body.classList.remove(...THEMES);
  document.body.classList.add(next);
  localStorage.setItem(THEME_KEY, next);
});

els.addBtn.addEventListener("click", () => openModal());
els.cancelBtn.addEventListener("click", closeModal);
els.modalMask.addEventListener("click", (event) => {
  if (event.target === els.modalMask) closeModal();
});

els.siteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = {
    name: els.nameInput.value.trim(),
    url: normalizeUrl(els.urlInput.value.trim()),
    category: els.categoryInput.value,
    icon: (els.iconInput.value.trim() || els.nameInput.value.trim().slice(0, 1)).slice(0, 2)
  };

  if (!data.name || !data.url) return;

  if (editingId) {
    sites = sites.map(site => site.id === editingId ? { ...site, ...data } : site);
  } else {
    sites.push({ id: cryptoId(), ...data });
  }

  saveSites();
  closeModal();
  render();
});

els.backupBtn.addEventListener("click", () => {
  els.backupMenu.classList.toggle("show");
});

document.addEventListener("click", (event) => {
  if (!els.backupMenu.contains(event.target) && event.target !== els.backupBtn) {
    els.backupMenu.classList.remove("show");
  }
});

els.exportBtn.addEventListener("click", () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: THEMES.find(t => document.body.classList.contains(t)) || THEMES[0],
    sites
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "满满中转站备份.json";
  a.click();
  URL.revokeObjectURL(url);
  els.backupMenu.classList.remove("show");
});

els.importBtn.addEventListener("click", () => els.importFile.click());
els.importFile.addEventListener("change", async () => {
  const file = els.importFile.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!Array.isArray(payload.sites)) throw new Error("格式不对");
    sites = payload.sites.map(site => ({
      id: site.id || cryptoId(),
      name: String(site.name || "未命名"),
      url: normalizeUrl(String(site.url || "#")),
      category: site.category === "common" ? "common" : "mine",
      icon: String(site.icon || String(site.name || "?").slice(0, 1)).slice(0, 2)
    }));
    saveSites();
    if (payload.theme && THEMES.includes(payload.theme)) {
      document.body.classList.remove(...THEMES);
      document.body.classList.add(payload.theme);
      localStorage.setItem(THEME_KEY, payload.theme);
    }
    render();
  } catch (error) {
    alert("导入失败：这个文件不是满满中转站备份。");
  } finally {
    els.importFile.value = "";
    els.backupMenu.classList.remove("show");
  }
});

function render() {
  const keyword = els.searchInput.value.trim().toLowerCase();
  const filtered = sites.filter(site => {
    return !keyword || site.name.toLowerCase().includes(keyword) || site.url.toLowerCase().includes(keyword);
  });

  renderTrack(els.mySitesTrack, filtered.filter(site => site.category === "mine"), false);
  renderTrack(els.commonSitesTrack, filtered.filter(site => site.category === "common"), true);
}

function renderTrack(track, list, compact) {
  track.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "这里暂时空空的，点右下角 ＋ 添加一个。";
    track.appendChild(empty);
    return;
  }

  list.forEach(site => {
    const card = document.createElement("article");
    card.className = `site-card ${compact ? "common-card" : ""}`;

    const icon = document.createElement("button");
    icon.className = "icon-box";
    icon.type = "button";
    icon.title = site.url;
    icon.addEventListener("click", () => openSite(site.url));

    const iconText = document.createElement("span");
    iconText.className = "icon-text";
    iconText.textContent = site.icon || site.name.slice(0, 1);
    icon.appendChild(iconText);

    const name = document.createElement("button");
    name.className = "site-name";
    name.type = "button";
    name.textContent = site.name;
    name.addEventListener("click", () => openSite(site.url));

    const actions = document.createElement("button");
    actions.className = "card-actions";
    actions.type = "button";
    actions.textContent = "⋯";
    actions.addEventListener("click", (event) => {
      event.stopPropagation();
      const choice = prompt(`编辑请输入 1，删除请输入 2\n\n${site.name}`);
      if (choice === "1") openModal(site);
      if (choice === "2") deleteSite(site.id);
    });

    card.append(icon, name, actions);
    track.appendChild(card);
  });
}

function openSite(url) {
  if (!url || url === "#") {
    alert("这个入口还没有填网址，点右上角小圆点可以编辑。");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function openModal(site = null) {
  editingId = site?.id || null;
  els.modalTitle.textContent = site ? "编辑网址" : "添加网址";
  els.nameInput.value = site?.name || "";
  els.urlInput.value = site?.url || "";
  els.categoryInput.value = site?.category || "mine";
  els.iconInput.value = site?.icon || "";
  els.modalMask.hidden = false;
  setTimeout(() => els.nameInput.focus(), 30);
}

function closeModal() {
  editingId = null;
  els.siteForm.reset();
  els.modalMask.hidden = true;
}

function deleteSite(id) {
  if (!confirm("确定删除这个入口吗？")) return;
  sites = sites.filter(site => site.id !== id);
  saveSites();
  render();
}

function loadSites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SITES;
  } catch {
    return DEFAULT_SITES;
  }
}

function saveSites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  document.body.classList.remove(...THEMES);
  document.body.classList.add(THEMES.includes(saved) ? saved : "theme-lamb");
}

function normalizeUrl(url) {
  if (!url || url === "#") return "#";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
}

function cryptoId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
