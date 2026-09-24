/* Painel /admin — Tey Romeiro Arquitetura
   Funciona no GitHub Pages: salva direto no repositório do site pela API do GitHub.
   A chave de acesso fica em admin/key.json, criptografada (AES-GCM) com a senha do painel. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DEFAULT_CATS = ["Residencial", "Corporativo", "Comercial", "Retrofit", "Interiores"];
  const DEFAULT_REPO = "rianromeiro/teyromeiro";
  const DATA_PATH = "data/projects.json";
  const JS_PATH = "js/projects.js";
  const KEY_PATH = "admin/key.json";
  const ITER = 600000;
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const DEV_API = isLocal ? new URLSearchParams(location.search).get("dev") : null;

  const state = { projects: [], editIndex: -1, draft: null, dirty: false, uploading: 0 };
  const gh = { api: "https://api.github.com", raw: "https://raw.githubusercontent.com", repo: "", branch: "main", token: "" };
  const pending = new Map();   // "img/uploads/x.webp" -> sha do blob já enviado ao GitHub (entra no próximo salvamento)
  const localUrls = new Map(); // "img/uploads/x.webp" -> blob: URL (pré-visualização imediata)

  /* ==========================================================
     Criptografia da chave (WebCrypto)
     ========================================================== */
  const te = new TextEncoder(), td = new TextDecoder();
  function toB64(buf) {
    const b = new Uint8Array(buf); let s = "";
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function deriveKey(pw, salt, iter) {
    const base = await crypto.subtle.importKey("raw", te.encode(pw), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encryptToken(token, pw) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pw, salt, ITER);
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(token));
    return { salt: toB64(salt), iv: toB64(iv), iter: ITER, data: toB64(data) };
  }
  async function decryptToken(box, pw) {
    const key = await deriveKey(pw, fromB64(box.salt), box.iter || ITER);
    const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(box.iv) }, key, fromB64(box.data));
    return td.decode(out);
  }
  const utf8b64 = s => toB64(te.encode(s));

  /* ==========================================================
     API do GitHub
     ========================================================== */
  class GhError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
  async function ghReq(path, { method = "GET", body, raw = false, token = gh.token } = {}) {
    let res;
    try {
      res = await fetch(gh.api + path, {
        method, cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new GhError("Não foi possível falar com o GitHub. Verifique sua internet e tente de novo.", 0);
    }
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.json()).message || ""; } catch (_) {}
      if (res.status === 401) throw new GhError("A chave de acesso do GitHub expirou ou foi revogada. Use “Configurar chave de acesso” na tela de entrada para cadastrar uma nova.", 401);
      if (res.status === 403) throw new GhError(/rate limit/i.test(msg) ? "Muitas ações seguidas no GitHub. Aguarde alguns minutos." : "A chave não tem permissão para gravar neste repositório (precisa de “Contents: Read and write”).", 403);
      if (res.status === 404) throw new GhError("Não encontrado no GitHub: " + path, 404);
      throw new GhError(`Erro do GitHub (${res.status}) ${msg}`.trim(), res.status);
    }
    if (res.status === 204) return null;
    return raw ? res.text() : res.json();
  }
  const R = () => `/repos/${gh.repo}`;

  async function readFile(path, ref = gh.branch) {
    return ghReq(`${R()}/contents/${path}?ref=${encodeURIComponent(ref)}`, { raw: true });
  }

  /* Um único commit com vários arquivos. files: [{path, content}] ou [{path, sha}] */
  async function commitFiles(files, message) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const ref = await ghReq(`${R()}/git/ref/heads/${gh.branch}`);
      const head = ref.object.sha;
      const cur = await ghReq(`${R()}/git/commits/${head}`);
      const tree = await ghReq(`${R()}/git/trees`, {
        method: "POST",
        body: { base_tree: cur.tree.sha, tree: files.map(f => f.sha ? { path: f.path, mode: "100644", type: "blob", sha: f.sha } : { path: f.path, mode: "100644", type: "blob", content: f.content }) }
      });
      const commit = await ghReq(`${R()}/git/commits`, { method: "POST", body: { message, tree: tree.sha, parents: [head] } });
      try {
        await ghReq(`${R()}/git/refs/heads/${gh.branch}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
        return commit.sha;
      } catch (e) {
        if (e.status !== 422 && e.status !== 409) throw e; // outra alteração entrou no meio — tenta de novo sobre a versão nova
      }
    }
    throw new GhError("Não consegui salvar porque o site foi alterado ao mesmo tempo. Tente de novo.", 409);
  }

  /* URL de imagem: pré-visualização local → site publicado → cópia direta no GitHub (enquanto o site atualiza) */
  const rawUrl = src => `${gh.raw}/${gh.repo}/${gh.branch}/${src}`;
  function imgTag(src, attrs = "") {
    if (!src) return "";
    if (localUrls.has(src)) return `<img src="${esc(localUrls.get(src))}" ${attrs}>`;
    return `<img src="../${esc(src)}" data-raw="${esc(rawUrl(src))}" onerror="if(this.dataset.raw){this.src=this.dataset.raw;this.removeAttribute('data-raw')}" ${attrs}>`;
  }
  function setImg(el, src) {
    const url = localUrls.get(src) || `../${src}`;
    if (el.dataset.cur === url) return;
    el.dataset.cur = url;
    el.onerror = () => { el.onerror = null; el.src = rawUrl(src); };
    el.src = url;
  }

  /* ==========================================================
     Normalização (o que antes o servidor fazia)
     ========================================================== */
  function slugify(t) {
    return (t || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "projeto";
  }
  function normalize(projects) {
    const used = new Set();
    return projects.filter(p => p && p.title).map(p => {
      let base = slugify(p.slug || p.title), slug = base, n = 2;
      while (used.has(slug)) slug = `${base}-${n++}`;
      used.add(slug);
      const o = { ...p, slug };
      ["location", "place", "year", "area", "status", "hover", "lead"].forEach(k => { if (!o[k]) delete o[k]; });
      if (!o.cover && o.gallery && o.gallery[0]) o.cover = o.gallery[0].src;
      return o;
    });
  }

  async function saveAll(projects, message) {
    const clean = normalize(projects);
    const json = JSON.stringify(clean, null, 2);
    const js = "/* Gerado automaticamente pelo painel /admin. Nao edite a mao: use o painel. */\nwindow.PROJECTS = " + json + ";\n";
    // fotos novas usadas por algum projeto entram no mesmo commit
    const used = new Set(clean.flatMap(p => [p.cover, p.hover, ...(p.gallery || []).map(g => g.src)]).filter(Boolean));
    const imgs = [...pending].filter(([src]) => used.has(src)).map(([path, sha]) => ({ path, sha }));
    await commitFiles([{ path: DATA_PATH, content: json + "\n" }, { path: JS_PATH, content: js }, ...imgs], message);
    imgs.forEach(f => pending.delete(f.path));
    state.projects = clean;
    return clean;
  }

  /* ==========================================================
     Login & configuração
     ========================================================== */
  const loginEl = $("#login"), setupEl = $("#setup"), pw = $("#login-pw"), loginErr = $("#login-error");
  let keyBox = null;

  async function loadKey() {
    try {
      const r = await fetch(`key.json?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) return null;
      return await r.json();
    } catch (_) { return null; }
  }
  function applyCfg(cfg) {
    gh.repo = cfg.repo; gh.branch = cfg.branch || "main";
    if (DEV_API) { gh.api = DEV_API; gh.raw = DEV_API.replace(/\/gh$/, "/raw"); }
  }
  function showLogin(msg) {
    setupEl.hidden = true; loginEl.hidden = false;
    $("#login-msg").textContent = msg || "Digite a senha para continuar.";
    loginErr.hidden = true; pw.value = "";
    setTimeout(() => pw.focus(), 50);
  }
  function showSetup() {
    loginEl.hidden = true; setupEl.hidden = false;
    $("#setup-repo").value = (keyBox && keyBox.repo) || guessRepo();
    $("#setup-error").hidden = true;
    setTimeout(() => $("#setup-token").focus(), 50);
  }
  function guessRepo() {
    const h = location.hostname;
    if (h.endsWith(".github.io")) {
      const owner = h.split(".")[0];
      const seg = location.pathname.split("/").filter(Boolean)[0];
      return seg && seg !== "admin" ? `${owner}/${seg}` : `${owner}/${h}`;
    }
    return DEFAULT_REPO;
  }

  $("#pw-toggle").addEventListener("click", e => {
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    e.currentTarget.textContent = show ? "Ocultar" : "Mostrar";
  });
  $("#to-setup").addEventListener("click", showSetup);
  $("#setup-back").addEventListener("click", () => keyBox ? showLogin() : toast("Faça a configuração inicial para usar o painel.", { error: true }));

  $("#login-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!pw.value) { pw.focus(); return; }
    if (!keyBox) { showSetup(); return; }
    const btn = $("#login-btn");
    btn.disabled = true; btn.textContent = "Entrando…"; loginErr.hidden = true;
    try {
      let token;
      try { token = await decryptToken(keyBox, pw.value); }
      catch (_) { await new Promise(r => setTimeout(r, 600)); throw new Error("Senha incorreta."); }
      gh.token = token;
      try { sessionStorage.setItem("tr_gh", token); } catch (_) {}
      loginEl.hidden = true;
      await enterApp();
    } catch (err) {
      gh.token = "";
      $("#app").hidden = true;
      loginEl.hidden = false;
      loginErr.textContent = err.message; loginErr.hidden = false;
      pw.select();
    } finally {
      btn.disabled = false; btn.textContent = "Entrar";
    }
  });

  $("#setup-form").addEventListener("submit", async e => {
    e.preventDefault();
    const err = $("#setup-error"); err.hidden = true;
    const repo = $("#setup-repo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$|\/$/g, "");
    const token = $("#setup-token").value.trim();
    const p1 = $("#setup-pw").value, p2 = $("#setup-pw2").value;
    const fail = m => { err.textContent = m; err.style.color = ""; err.hidden = false; };
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return fail("Repositório no formato usuario/repositorio (ex.: rianromeiro/teyromeiro).");
    if (!token) return fail("Cole a chave de acesso do GitHub.");
    if (p1.length < 4) return fail("Escolha uma senha para o painel.");
    if (p1 !== p2) return fail("As senhas não conferem.");
    const btn = $("#setup-btn"); btn.disabled = true; btn.textContent = "Verificando…";
    try {
      applyCfg({ repo });
      const info = await ghReq(`/repos/${repo}`, { token }).catch(e2 => {
        if (e2.status === 404) throw new Error("Repositório não encontrado — confira o nome e se a chave tem acesso a ele.");
        if (e2.status === 401) throw new Error("Chave inválida. Confira se copiou o código inteiro.");
        throw e2;
      });
      if (info.permissions && info.permissions.push === false) throw new Error("A chave não tem permissão de escrita. Em Permissions, marque Contents: “Read and write”.");
      gh.branch = info.default_branch || "main";
      gh.token = token;
      btn.textContent = "Salvando…";
      const box = { v: 1, repo, branch: gh.branch, ...(await encryptToken(token, p1)) };
      await commitFiles([{ path: KEY_PATH, content: JSON.stringify(box, null, 2) + "\n" }], "Painel: configurar chave de acesso");
      keyBox = box;
      try { sessionStorage.setItem("tr_gh", token); sessionStorage.setItem("tr_cfg", JSON.stringify({ repo, branch: gh.branch })); } catch (_) {}
      $("#setup-token").value = ""; $("#setup-pw").value = ""; $("#setup-pw2").value = "";
      setupEl.hidden = true;
      await enterApp();
      toast("Configuração salva! Nas próximas vezes, entre só com a senha.");
    } catch (e2) {
      gh.token = "";
      fail(e2.message);
    } finally {
      btn.disabled = false; btn.textContent = "Salvar configuração";
    }
  });

  async function enterApp() {
    const txt = await readFile(DATA_PATH).catch(e => { if (e.status === 404) return "[]"; throw e; });
    state.projects = JSON.parse(txt || "[]");
    $("#app").hidden = false;
    showList();
  }

  function logout() {
    gh.token = "";
    try { sessionStorage.removeItem("tr_gh"); } catch (_) {}
    state.dirty = false;
    $("#app").hidden = true;
    showLogin("Você saiu do painel.");
  }

  /* ==========================================================
     Toast & modal
     ========================================================== */
  let toastTimer;
  function toast(msg, { error = false, link } = {}) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>${link ? `<a href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.label)}</a>` : ""}`;
    t.classList.toggle("is-error", error);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), error ? 8000 : 6000);
  }
  function modal(title, bodyHtml, buttons) {
    return new Promise(resolve => {
      const m = $("#modal");
      $("#modal-title").textContent = title;
      $("#modal-body").innerHTML = bodyHtml;
      const acts = $("#modal-actions");
      acts.innerHTML = "";
      const close = v => { m.hidden = true; document.removeEventListener("keydown", onKey); resolve(v); };
      buttons.forEach(b => {
        const el = document.createElement("button");
        el.type = "button"; el.className = "btn " + (b.cls || "btn--ghost"); el.textContent = b.label;
        el.addEventListener("click", () => close(b.value));
        acts.appendChild(el);
      });
      const onKey = e => { if (e.key === "Escape") close(null); };
      document.addEventListener("keydown", onKey);
      m.onclick = e => { if (e.target === m) close(null); };
      m.hidden = false;
      const primary = acts.querySelector(".btn--solid, .btn--danger");
      primary && primary.focus();
    });
  }
  const confirmBox = (title, body, okLabel, danger) =>
    modal(title, body, [{ label: "Cancelar", value: false }, { label: okLabel, value: true, cls: danger ? "btn--danger" : "btn--solid" }]);
  const UPDATE_NOTE = "O site atualiza em 1–2 minutos.";

  /* ==========================================================
     Lista de projetos
     ========================================================== */
  function showList(flashSlug) {
    $("#view-edit").hidden = true;
    $("#view-list").hidden = false;
    state.draft = null; state.dirty = false;
    renderList(flashSlug);
    window.scrollTo(0, 0);
  }

  function renderList(flashSlug) {
    const list = $("#plist");
    const n = state.projects.length;
    const pub = state.projects.filter(p => p.published !== false).length;
    $("#list-count").textContent = n ? `${n} projeto${n > 1 ? "s" : ""} · ${pub} publicado${pub !== 1 ? "s" : ""}` : "";
    if (!n) {
      list.innerHTML = `<li class="tip">Nenhum projeto ainda. Clique em <b>Novo projeto</b> para começar.</li>`;
      return;
    }
    list.innerHTML = state.projects.map((p, i) => {
      const photos = (p.gallery || []).length;
      const meta = [p.category, p.place].filter(Boolean).join(" · ");
      return `
      <li class="prow${p.slug === flashSlug ? " is-flash" : ""}" data-i="${i}">
        <div class="prow__thumb" data-act="edit">${imgTag(p.cover, 'alt="" loading="lazy"')}</div>
        <div class="prow__main" data-act="edit">
          <h3 class="prow__title">${esc(p.title)}</h3>
          <p class="prow__meta">${esc(meta) || "&nbsp;"}</p>
          <div class="prow__badges">
            ${p.published !== false ? `<span class="pill pill--ok"><i></i>Publicado</span>` : `<span class="pill pill--off"><i></i>Oculto</span>`}
            ${p.featured ? `<span class="pill pill--hero">Na abertura</span>` : ""}
            <span class="pill">${photos} foto${photos !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div class="prow__actions">
          <button class="icon-btn" data-act="up" title="Subir" aria-label="Subir ${esc(p.title)}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-btn" data-act="down" title="Descer" aria-label="Descer ${esc(p.title)}" ${i === n - 1 ? "disabled" : ""}>↓</button>
          <button class="btn btn--ghost btn--sm" data-act="edit">Editar</button>
          <button class="icon-btn icon-btn--danger" data-act="delete" title="Excluir" aria-label="Excluir ${esc(p.title)}">✕</button>
        </div>
      </li>`;
    }).join("");
  }

  let listBusy = false;
  $("#plist").addEventListener("click", async e => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled || listBusy) return;
    const row = el.closest(".prow");
    const i = +row.dataset.i;
    const act = el.dataset.act;
    if (act === "edit") return openEditor(i);
    const run = async (next, msg, commitMsg, flash) => {
      listBusy = true; $("#plist").style.opacity = ".6";
      try { await saveAll(next, commitMsg); renderList(flash); toast(`${msg} ${UPDATE_NOTE}`); }
      catch (err) { toast(err.message, { error: true }); }
      finally { listBusy = false; $("#plist").style.opacity = ""; }
    };
    if (act === "up" || act === "down") {
      const j = act === "up" ? i - 1 : i + 1;
      const next = state.projects.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return run(next, "Ordem atualizada.", "Painel: reordenar projetos", next[j].slug);
    }
    if (act === "delete") {
      const p = state.projects[i];
      const ok = await confirmBox(`Excluir “${p.title}”?`,
        `<p>O projeto sai do site. Se mudar de ideia, dá para recuperar em <b>Histórico</b>, no topo da página.</p>
         <p class="muted">Dica: para apenas esconder, abra o projeto e desligue “Publicado no site”.</p>`, "Excluir", true);
      if (!ok) return;
      return run(state.projects.filter((_, k) => k !== i), "Projeto excluído.", `Painel: excluir ${p.title}`);
    }
  });

  /* ==========================================================
     Editor
     ========================================================== */
  const form = $("#edit-form");
  const F = id => $("#f-" + id);
  let uid = 0;

  function categories() {
    return [...new Set([...DEFAULT_CATS, ...state.projects.map(p => p.category).filter(Boolean)])];
  }

  function openEditor(index) {
    state.editIndex = index;
    const p = index >= 0 ? state.projects[index] : null;
    const src = p || { title: "", category: "Residencial", published: true, featured: false, gallery: [], text: [], tags: [], credits: [["Projeto", "Tey Romeiro Arquitetura"]], heroPos: "50% 50%" };
    state.draft = {
      slug: src.slug || "",
      location: src.location || "",
      cover: src.cover || "",
      hover: src.hover || "",
      heroPos: src.heroPos || "50% 50%",
      images: (src.gallery || []).map(g => ({ id: ++uid, src: g.src, alt: g.alt || "", layout: g.layout || "", status: "ok" })),
    };
    if (state.draft.cover && !state.draft.images.some(im => im.src === state.draft.cover)) {
      state.draft.images.unshift({ id: ++uid, src: state.draft.cover, alt: "", layout: "", status: "ok" });
    }

    $("#edit-title").textContent = p ? p.title : "Novo projeto";
    const view = $("#edit-view");
    view.hidden = !p || p.published === false;
    if (p) view.href = `../projeto.html?p=${encodeURIComponent(p.slug)}`;

    F("title").value = src.title || "";
    const cats = categories();
    const sel = F("category");
    sel.innerHTML = cats.map(c => `<option>${esc(c)}</option>`).join("") + `<option value="__new">＋ Nova categoria…</option>`;
    sel.value = src.category && cats.includes(src.category) ? src.category : cats[0];
    $("#f-category-new-wrap").hidden = true; F("category-new").value = "";
    F("place").value = src.place || "";
    F("year").value = src.year || "";
    F("area").value = src.area || "";
    F("status").value = src.status || "";
    F("tags").value = (src.tags || []).join(", ");
    F("lead").value = src.lead || "";
    F("text").value = (src.text || []).join("\n\n");
    F("published").checked = src.published !== false;
    F("featured").checked = !!src.featured;
    renderCredits(src.credits || []);
    $$(".is-invalid", form).forEach(el => el.classList.remove("is-invalid"));

    renderThumbs();
    setDirty(false);
    $("#view-list").hidden = true;
    $("#view-edit").hidden = false;
    window.scrollTo(0, 0);
    if (!p) setTimeout(() => F("title").focus(), 50);
  }

  function setDirty(v) {
    state.dirty = v;
    const s = $("#save-status");
    s.textContent = v ? "Alterações não salvas" : "Tudo salvo";
    s.classList.toggle("is-dirty", v);
  }
  form.addEventListener("input", () => setDirty(true));
  form.addEventListener("change", () => setDirty(true));
  addEventListener("beforeunload", e => { if (state.dirty || state.uploading) { e.preventDefault(); e.returnValue = ""; } });

  F("category").addEventListener("change", e => {
    const isNew = e.target.value === "__new";
    $("#f-category-new-wrap").hidden = !isNew;
    if (isNew) F("category-new").focus();
  });

  /* ---------- ficha técnica ---------- */
  function creditRow(k = "", v = "") {
    const li = document.createElement("li");
    li.className = "credit";
    li.innerHTML = `
      <input type="text" list="credit-labels" maxlength="60" placeholder="Ex.: Equipe" value="${esc(k)}" aria-label="Nome da informação">
      <input type="text" maxlength="400" placeholder="Ex.: @brunosouza.sp_ · @arquitetamariaeduardaw" value="${esc(v)}" aria-label="Valor">
      <button type="button" class="icon-btn icon-btn--danger" title="Remover" aria-label="Remover linha">✕</button>`;
    li.querySelector("button").addEventListener("click", () => { li.remove(); setDirty(true); });
    return li;
  }
  function renderCredits(rows) {
    const ul = $("#credits");
    ul.innerHTML = "";
    rows.forEach(([k, v]) => ul.appendChild(creditRow(k, v)));
  }
  $("#btn-add-credit").addEventListener("click", () => {
    const li = creditRow();
    $("#credits").appendChild(li);
    li.querySelector("input").focus();
    setDirty(true);
  });

  /* ---------- fotos ---------- */
  function renderThumbs() {
    const d = state.draft;
    const ul = $("#thumbs");
    $("#thumbs-empty").hidden = d.images.length > 0;
    ul.innerHTML = d.images.map((im, i) => {
      const isCover = im.status === "ok" && im.src === d.cover;
      const isAlt = im.status === "ok" && im.src === d.hover;
      const img = im.localUrl ? `<img src="${esc(im.localUrl)}" alt="">` : imgTag(im.src, 'alt="" loading="lazy"');
      return `
      <li class="thumb${isCover ? " is-cover" : ""}" data-id="${im.id}" draggable="${im.status === "ok"}">
        <div class="thumb__img">
          ${img}
          <span class="thumb__num">${i + 1}</span>
          <span class="thumb__badges">${isCover ? `<i class="badge badge--cover">Capa</i>` : ""}${isAlt ? `<i class="badge badge--alt">Alternativa</i>` : ""}</span>
          ${im.status === "uploading" ? `<span class="thumb__loading">${esc(im.note || "Enviando…")}</span>` : ""}
          ${im.status === "error" ? `<span class="thumb__err">${esc(im.error)}</span>` : ""}
        </div>
        <div class="thumb__bar">
          ${im.status === "ok" ? `
            <button type="button" class="chip${isCover ? " is-on" : ""}" data-act="cover">${isCover ? "✓ Capa" : "Usar como capa"}</button>
            <button type="button" class="chip chip--alt${isAlt ? " is-on" : ""}" data-act="alt" ${isCover ? "disabled" : ""}>${isAlt ? "✓ Alternativa" : "Alternativa"}</button>` : ""}
          <div class="thumb__moves">
            <button type="button" class="icon-btn" data-act="left" aria-label="Mover para trás" ${i === 0 ? "disabled" : ""}>←</button>
            <button type="button" class="icon-btn" data-act="right" aria-label="Mover para frente" ${i === d.images.length - 1 ? "disabled" : ""}>→</button>
            <button type="button" class="icon-btn icon-btn--danger" data-act="remove" aria-label="Remover foto">✕</button>
          </div>
        </div>
      </li>`;
    }).join("");
    renderFocus();
  }

  $("#thumbs").addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const d = state.draft;
    const li = b.closest(".thumb");
    const i = d.images.findIndex(im => im.id === +li.dataset.id);
    const im = d.images[i];
    switch (b.dataset.act) {
      case "cover":
        if (d.cover !== im.src) d.heroPos = "50% 50%";
        d.cover = im.src;
        if (d.hover === im.src) d.hover = "";
        break;
      case "alt": d.hover = d.hover === im.src ? "" : im.src; break;
      case "left": if (i > 0) [d.images[i - 1], d.images[i]] = [d.images[i], d.images[i - 1]]; break;
      case "right": if (i < d.images.length - 1) [d.images[i + 1], d.images[i]] = [d.images[i], d.images[i + 1]]; break;
      case "remove":
        d.images.splice(i, 1);
        if (im.src && d.cover === im.src) d.cover = (d.images.find(x => x.status === "ok") || {}).src || "";
        if (im.src && d.hover === im.src) d.hover = "";
        break;
    }
    setDirty(true);
    renderThumbs();
  });

  // arrastar para reordenar (computador)
  let dragId = null;
  const thumbsEl = $("#thumbs");
  thumbsEl.addEventListener("dragstart", e => {
    const li = e.target.closest(".thumb"); if (!li) return;
    dragId = +li.dataset.id; li.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(dragId)); } catch (_) {}
  });
  thumbsEl.addEventListener("dragend", () => { dragId = null; $$(".thumb", thumbsEl).forEach(t => t.classList.remove("is-dragging", "is-over")); });
  thumbsEl.addEventListener("dragover", e => {
    if (dragId === null) return;
    e.preventDefault();
    const li = e.target.closest(".thumb");
    $$(".thumb", thumbsEl).forEach(t => t.classList.toggle("is-over", t === li && +li.dataset.id !== dragId));
  });
  thumbsEl.addEventListener("drop", e => {
    if (dragId === null) return;
    e.preventDefault(); e.stopPropagation();
    const li = e.target.closest(".thumb"); if (!li) return;
    const imgs = state.draft.images;
    const from = imgs.findIndex(x => x.id === dragId), to = imgs.findIndex(x => x.id === +li.dataset.id);
    if (from < 0 || to < 0 || from === to) return;
    const [m] = imgs.splice(from, 1); imgs.splice(to, 0, m);
    dragId = null; setDirty(true); renderThumbs();
  });

  // enviar fotos
  const drop = $("#drop"), fileInput = $("#file-input");
  fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { if (dragId !== null) return; e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", e => { if (dragId !== null) return; e.preventDefault(); addFiles(e.dataTransfer.files); });

  const queue = [];
  let active = 0;
  function addFiles(files) {
    const list = [...files].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if (!list.length) { toast("Selecione arquivos de imagem (JPG, PNG ou WEBP).", { error: true }); return; }
    list.forEach(file => {
      const item = { id: ++uid, status: "uploading", note: "Otimizando…", localUrl: URL.createObjectURL(file), alt: "", layout: "" };
      state.draft.images.push(item);
      queue.push({ file, item, draft: state.draft });
    });
    setDirty(true);
    renderThumbs();
    pump();
  }
  function pump() {
    while (active < 2 && queue.length) {
      const job = queue.shift();
      active++; state.uploading++;
      uploadOne(job).finally(() => { active--; state.uploading--; pump(); });
    }
  }
  const blobToB64 = blob => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = () => rej(new Error("Não consegui ler a foto"));
    r.readAsDataURL(blob);
  });
  async function uploadOne({ file, item, draft }) {
    try {
      const blob = await optimize(file);
      item.note = "Enviando…"; if (draft === state.draft) renderThumbs();
      const b = await ghReq(`${R()}/git/blobs`, { method: "POST", body: { content: await blobToB64(blob), encoding: "base64" } });
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const rnd = Array.from(crypto.getRandomValues(new Uint8Array(4)), x => x.toString(16).padStart(2, "0")).join("");
      const src = `img/uploads/${slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40)}-${rnd}.${ext}`;
      pending.set(src, b.sha);
      localUrls.set(src, URL.createObjectURL(blob));
      item.src = src; item.status = "ok";
      if (!draft.cover) draft.cover = item.src;
    } catch (err) {
      item.status = "error";
      item.error = err.message || "Falha ao enviar";
    }
    if (draft === state.draft) renderThumbs();
  }

  // redimensiona para no máx. 2400px e comprime (WEBP, ou JPG se o navegador não suportar)
  async function optimize(file) {
    let source;
    try {
      source = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (_) {
      source = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => rej(new Error(/hei[cf]/i.test(file.name) ? "Foto HEIC: envie em JPG" : "Não consegui ler esta foto"));
        img.src = URL.createObjectURL(file);
      });
    }
    const w = source.width, h = source.height;
    const scale = Math.min(1, 2400 / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    c.getContext("2d").drawImage(source, 0, 0, c.width, c.height);
    const enc = (type, q) => new Promise(r => c.toBlob(r, type, q));
    let blob = await enc("image/webp", 0.84);
    if (!blob || blob.type !== "image/webp") blob = await enc("image/jpeg", 0.86);
    if (blob && blob.size > 3.5 * 1024 * 1024) blob = await enc(blob.type, 0.7);
    if (!blob) throw new Error("Não consegui processar esta foto");
    return blob;
  }

  // enquadramento da capa (ponto de foco)
  function renderFocus() {
    const d = state.draft;
    const box = $("#focus-box");
    const img = d.images.find(im => im.status === "ok" && im.src === d.cover);
    if (!img) { box.hidden = true; return; }
    box.hidden = false;
    ["#focus-img", "#fp1", "#fp2"].forEach(s => setImg($(s), img.src));
    const [x, y] = d.heroPos.split(" ");
    const dot = $("#focus-dot");
    dot.style.left = x; dot.style.top = y;
    $("#fp1").style.objectPosition = d.heroPos;
    $("#fp2").style.objectPosition = d.heroPos;
  }
  $("#focus-frame").addEventListener("click", e => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100)));
    const y = Math.round(Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100)));
    state.draft.heroPos = `${x}% ${y}%`;
    setDirty(true);
    renderFocus();
  });

  /* ---------- salvar / cancelar ---------- */
  function collect() {
    const d = state.draft;
    let category = F("category").value;
    if (category === "__new") category = F("category-new").value.trim();
    const credits = $$("#credits .credit").map(li => $$("input", li).map(i => i.value.trim())).filter(([k, v]) => k && v);
    const images = d.images.filter(im => im.status === "ok");
    return {
      slug: d.slug,
      title: F("title").value.trim(),
      location: d.location,
      place: F("place").value.trim(),
      category,
      year: F("year").value.trim(),
      area: F("area").value.trim(),
      status: F("status").value.trim(),
      tags: F("tags").value.split(/[,;]/).map(s => s.trim()).filter(Boolean),
      cover: images.some(im => im.src === d.cover) ? d.cover : (images[0] || {}).src || "",
      hover: images.some(im => im.src === d.hover) ? d.hover : "",
      heroPos: d.heroPos,
      lead: F("lead").value.trim(),
      text: F("text").value.split(/\n\s*\n/).map(s => s.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean),
      credits,
      gallery: images.map(im => {
        const g = { src: im.src, alt: im.alt || "" };
        if (im.layout) g.layout = im.layout;
        return g;
      }),
      published: F("published").checked,
      featured: F("featured").checked,
    };
  }

  $("#btn-save").addEventListener("click", async () => {
    const p = collect();
    $$(".is-invalid", form).forEach(el => el.classList.remove("is-invalid"));
    const invalid = (el, msg) => { el.classList.add("is-invalid"); el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus({ preventScroll: true }); toast(msg, { error: true }); };
    if (!p.title) return invalid(F("title"), "Dê um nome ao projeto.");
    if (F("category").value === "__new" && !p.category) return invalid(F("category-new"), "Escreva o nome da nova categoria.");
    if (state.uploading) return toast("Aguarde as fotos terminarem de enviar.", { error: true });
    if (state.draft.images.some(im => im.status === "error")) {
      const ok = await confirmBox("Algumas fotos não foram enviadas", "<p>As fotos com erro serão deixadas de fora. Deseja salvar mesmo assim?</p>", "Salvar sem elas");
      if (!ok) return;
    }
    if (p.published && !p.gallery.length) return toast("Adicione pelo menos uma foto para publicar o projeto (ou desligue “Publicado no site”).", { error: true });

    const next = state.projects.slice();
    const isNew = state.editIndex < 0;
    if (isNew) next.unshift(p); else next[state.editIndex] = p;

    const btn = $("#btn-save");
    btn.disabled = true; btn.textContent = "Salvando…";
    try {
      const saved = await saveAll(next, `Painel: ${isNew ? "novo projeto" : "editar"} ${p.title}`);
      const sp = saved[isNew ? 0 : state.editIndex];
      setDirty(false);
      showList(sp.slug);
      toast(`${isNew ? "Projeto publicado!" : "Alterações salvas!"} ${UPDATE_NOTE}`, sp.published ? { link: { href: `../projeto.html?p=${encodeURIComponent(sp.slug)}`, label: "Ver no site ↗" } } : {});
    } catch (err) {
      toast(err.message, { error: true });
    } finally {
      btn.disabled = false; btn.textContent = "Salvar projeto";
    }
  });

  async function leaveEditor() {
    if (state.uploading) {
      const ok = await confirmBox("Fotos ainda enviando", "<p>Se sair agora, as fotos que estão sendo enviadas serão perdidas.</p>", "Sair mesmo assim", true);
      if (!ok) return;
    } else if (state.dirty) {
      const ok = await confirmBox("Descartar alterações?", "<p>Você fez alterações que ainda não foram salvas.</p>", "Descartar", true);
      if (!ok) return;
    }
    showList();
  }
  $("#btn-cancel").addEventListener("click", leaveEditor);
  $("#btn-back").addEventListener("click", leaveEditor);
  $("#btn-new").addEventListener("click", () => openEditor(-1));

  /* ---------- histórico (versões anteriores = histórico do próprio GitHub) ---------- */
  $("#btn-history").addEventListener("click", async () => {
    if (state.dirty) return toast("Salve ou cancele a edição atual antes de abrir o histórico.", { error: true });
    let list;
    try { list = await ghReq(`${R()}/commits?path=${DATA_PATH}&sha=${gh.branch}&per_page=30`); }
    catch (err) { return toast(err.message, { error: true }); }
    const fmt = iso => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const rows = list.slice(1); // o primeiro é a versão atual
    const body = rows.length
      ? `<p>Cada vez que você salva, a versão anterior fica guardada. Restaurar volta o portfólio inteiro para aquele momento.</p>
         <ul class="hist">${rows.map(c => `<li><span>${esc(fmt(c.commit.author.date))}<br><span class="muted">${esc(c.commit.message.replace(/^Painel: /, ""))}</span></span><button class="btn btn--ghost btn--sm" data-sha="${esc(c.sha)}" data-date="${esc(fmt(c.commit.author.date))}">Restaurar</button></li>`).join("")}</ul>`
      : `<p>Ainda não há versões anteriores. Elas aparecem aqui depois do primeiro salvamento.</p>`;
    const p = modal("Histórico de versões", body, [{ label: "Fechar", value: null }]);
    $("#modal-body").onclick = async e => {
      const b = e.target.closest("[data-sha]"); if (!b) return;
      $("#modal").hidden = true;
      const ok = await confirmBox("Restaurar esta versão?", `<p>O portfólio volta a ficar como estava em ${esc(b.dataset.date)}. A versão atual também continua guardada no histórico.</p>`, "Restaurar");
      if (!ok) return;
      try {
        const old = JSON.parse(await readFile(DATA_PATH, b.dataset.sha));
        await saveAll(old, `Painel: restaurar versão de ${b.dataset.date}`);
        showList(); toast(`Versão restaurada. ${UPDATE_NOTE}`);
      } catch (err) { toast(err.message, { error: true }); }
    };
    await p;
  });

  /* ---------- sair ---------- */
  $("#btn-logout").addEventListener("click", async () => {
    if (state.dirty) {
      const ok = await confirmBox("Sair sem salvar?", "<p>Há alterações não salvas neste projeto.</p>", "Sair", true);
      if (!ok) return;
    }
    logout();
  });

  /* ---------- início ---------- */
  (async () => {
    if (!window.crypto || !crypto.subtle) {
      showLogin("Este painel precisa ser aberto pelo endereço seguro do site (https).");
      return;
    }
    keyBox = await loadKey();
    let cfg = keyBox;
    if (!cfg) { try { cfg = JSON.parse(sessionStorage.getItem("tr_cfg") || "null"); } catch (_) {} }
    if (cfg) applyCfg(cfg);
    let saved = null;
    try { saved = sessionStorage.getItem("tr_gh"); } catch (_) {}
    if (saved && cfg) {
      gh.token = saved;
      try { await enterApp(); return; } catch (err) { gh.token = ""; $("#app").hidden = true; }
    }
    if (!keyBox) {
      // A configuração pode ter acabado de ser feita e o site ainda estar atualizando
      showSetup();
      $("#setup-error").textContent = "Primeiro acesso: faça a configuração abaixo. (Se você acabou de configurar, aguarde 1–2 minutos e recarregue a página.)";
      $("#setup-error").hidden = false;
      $("#setup-error").style.color = "var(--ink-2)";
      return;
    }
    showLogin();
  })();
})();
