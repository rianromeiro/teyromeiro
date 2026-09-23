(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PROJECTS = window.PROJECTS || [];
  const WA = "https://wa.me/5511940209063";

  // Modo página única (prévia): projetos abrem dentro da mesma página, via #slug
  const spaView = $("#spa-project");
  const SPA = !!spaView;
  const homeView = $("#topo");
  const isProjectPage = document.body.classList.contains("page-project");
  const bySlug = s => PROJECTS.find(p => p.slug === s);
  const projectHref = slug => SPA ? `#${slug}` : `projeto.html?p=${slug}`;
  const homeHref = anchor => SPA || !isProjectPage ? `#${anchor}` : `index.html#${anchor}`;

  let lenis = null;
  let lbItems = [], cur = 0;

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
  const observe = root => $$(".reveal, .reveal-img", root).forEach(el => { if (!el.classList.contains("is-in")) io.observe(el); });

  /* Ritmo padronizado: 1 grande (16:9) + 2 iguais, repetindo.
     Um item que ficaria sozinho numa linha vira grande. */
  function rhythm(items, wideClass) {
    let col = 0;
    items.forEach((el, i) => {
      const next = items[i + 1];
      let wide = i % 3 === 0;
      if (!wide && col === 0 && !next) wide = true;
      if (!wide && col === 0 && next && (i + 1) % 3 === 0) wide = true;
      el.classList.toggle(wideClass, wide);
      col = wide ? 0 : (col + 1) % 2;
    });
  }

  /* ---------- portfólio (home) ---------- */
  const grid = $(".js-projects");
  if (grid) {
    grid.innerHTML = PROJECTS.map(p => `
      <a class="pcard" href="${projectHref(p.slug)}" data-cat="${p.category}">
        <div class="pcard__media reveal-img">
          <img src="${p.cover}" alt="${p.title}" loading="lazy">
          ${p.hover ? `<img class="pcard__hover" src="${p.hover}" alt="" loading="lazy">` : ""}
        </div>
        <div class="pcard__info">
          <h3 class="pcard__title">${p.title}</h3>
          <span class="pcard__meta"><span>${p.category}</span>${p.place ? `<i>|</i><span>${p.place}</span>` : ""}${p.year ? `<i>|</i><span>${p.year}</span>` : ""}</span>
        </div>
      </a>`).join("");
    const cards = $$(".pcard", grid);
    const apply = f => {
      const visible = cards.filter(c => f === "*" || c.dataset.cat === f);
      cards.forEach(c => c.classList.toggle("is-filtered", !visible.includes(c)));
      rhythm(visible, "pcard--wide");
    };
    apply("*");
    $$(".js-filters button").forEach(b => b.addEventListener("click", () => {
      $$(".js-filters button").forEach(x => x.classList.toggle("is-active", x === b));
      apply(b.dataset.filter);
      $$(".reveal-img", grid).forEach(el => el.classList.add("is-in"));
    }));
    // esconde filtros sem projetos
    $$(".js-filters button").forEach(b => {
      if (b.dataset.filter !== "*" && !PROJECTS.some(p => p.category === b.dataset.filter)) b.parentElement.hidden = true;
    });
  }
  if (SPA) $$('a[href^="projeto.html?p="]').forEach(a => a.setAttribute("href", "#" + a.getAttribute("href").split("p=")[1]));

  /* ---------- página de projeto (multipágina) ---------- */
  if (isProjectPage) {
    const slug = new URLSearchParams(location.search).get("p");
    renderProject(bySlug(slug) ? slug : PROJECTS[0].slug, $(".js-project"));
  }
  observe(document);

  /* ---------- preloader (só na primeira visita da sessão) ---------- */
  const pre = $(".preloader");
  let seen = false;
  try { seen = sessionStorage.getItem("tr-seen") === "1"; sessionStorage.setItem("tr-seen", "1"); } catch (e) {}
  if (pre) {
    if (seen || reduced) pre.classList.add("is-skip");
    else {
      let fired = false;
      const done = () => { if (!fired) { fired = true; pre.classList.add("is-done"); } };
      const t = Date.now();
      const finish = () => setTimeout(done, Math.max(0, 1100 - (Date.now() - t)));
      if (document.readyState === "complete") finish(); else addEventListener("load", finish);
      setTimeout(done, 2800);
    }
  }

  /* ---------- rolagem suave ---------- */
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const header = $("#header");
  const headerH = () => header ? header.offsetHeight : 0;
  const scrollToY = (y, immediate) => {
    if (immediate) {
      lenis && lenis.scrollTo(y, { immediate: true, force: true });
      window.scrollTo({ top: y, behavior: "instant" });
      return;
    }
    lenis ? lenis.scrollTo(y) : scrollTo({ top: y, behavior: "smooth" });
  };
  const targetY = hash => {
    if (hash === "#topo") return 0;
    const t = $(hash);
    return t ? Math.max(0, t.getBoundingClientRect().top + scrollY - headerH() + 1) : null;
  };

  /* ---------- navegação por âncoras (delegada) ---------- */
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    const h = a.getAttribute("href") || "";
    if (h[0] !== "#" || h.length < 2) return;
    closeMenu();
    e.preventDefault();
    if (SPA && bySlug(h.slice(1))) { openProject(h.slice(1)); return; }
    if (SPA && !spaView.hidden) {
      closeProject();
      setTimeout(() => {
        lenis && lenis.resize && lenis.resize();
        const y = targetY(h);
        y !== null && scrollToY(y, true);
      }, 50);
      return;
    }
    const y = targetY(h);
    y !== null && scrollToY(y);
  });

  /* ---------- header fixo + botão WhatsApp ---------- */
  const wa = $(".wa-float");
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    wa && wa.classList.toggle("is-visible", y > innerHeight * .6);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- menu mobile ---------- */
  const menuBtn = $(".menu-btn");
  const menu = $(".mobile-menu");
  function closeMenu() {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menu && menu.setAttribute("aria-hidden", "true");
    lenis && lenis.start();
  }
  menuBtn && menuBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menu && menu.setAttribute("aria-hidden", String(!open));
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* ---------- slideshow da abertura ---------- */
  const slides = $$(".hero__slide");
  if (slides.length) {
    const DUR = 5500;
    const bar = $(".hero__progress");
    const tEl = $(".js-hero-title"), sEl = $(".js-hero-sub"), link = $(".hero__caption a");
    bar.style.setProperty("--slide-dur", DUR + "ms");
    bar.innerHTML = slides.map(s => `<button role="tab" aria-label="${s.dataset.title}"><i></i></button>`).join("");
    const btns = $$("button", bar);
    const toHref = h => SPA ? "#" + h.split("p=")[1] : h;
    link.setAttribute("href", toHref(slides[0].dataset.href));
    let idx = 0, timer;
    const go = n => {
      slides[idx].classList.remove("is-active");
      idx = (n + slides.length) % slides.length;
      const s = slides[idx];
      $("img", s).loading = "eager";
      s.classList.add("is-active");
      link.style.opacity = 0;
      setTimeout(() => { tEl.textContent = s.dataset.title; sEl.textContent = s.dataset.sub; link.setAttribute("href", toHref(s.dataset.href)); link.style.opacity = 1; }, 350);
      btns.forEach((b, i) => { b.classList.toggle("is-done", i < idx); b.classList.remove("is-active"); });
      void btns[idx].offsetWidth; btns[idx].classList.add("is-active");
      clearTimeout(timer); timer = setTimeout(() => go(idx + 1), DUR);
    };
    btns.forEach((b, i) => b.addEventListener("click", () => go(i)));
    slides.forEach(s => { const im = new Image(); im.src = $("img", s).src; });
    btns[0].classList.add("is-active");
    timer = setTimeout(() => go(1), DUR);
    // arrastar no celular troca a imagem
    let sx = null;
    const frame = $(".hero__frame");
    frame.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener("touchend", e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- formulário → WhatsApp (link real, funciona em qualquer celular) ---------- */
  const form = $(".js-contact");
  if (form) {
    const send = $(".js-wa-send", form);
    const update = () => {
      const nome = form.nome.value.trim(), tipo = form.tipo.value, msg = form.mensagem.value.trim();
      const text = `Olá, Tey Romeiro Arquitetura!${nome ? ` Meu nome é ${nome}.` : ""}\nTipo de projeto: ${tipo}.${msg ? "\n\n" + msg : ""}`;
      send.href = `${WA}?text=${encodeURIComponent(text)}`;
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", e => { e.preventDefault(); update(); send.click(); });
    update();
  }

  $$(".js-year").forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- lightbox ---------- */
  const lb = $(".lightbox");
  if (lb) {
    const lbImg = $("img", lb), lbCount = $(".lightbox__count", lb);
    const show = n => {
      cur = (n + lbItems.length) % lbItems.length;
      lbImg.src = lbItems[cur].src; lbImg.alt = lbItems[cur].alt || "";
      lbCount.textContent = `${cur + 1} / ${lbItems.length}`;
    };
    const close = () => { lb.classList.remove("is-open"); lenis && lenis.start(); };
    document.addEventListener("click", e => {
      const f = e.target.closest(".g-item");
      if (!f) return;
      show(+f.dataset.i); lb.classList.add("is-open"); lenis && lenis.stop();
    });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__nav--prev", lb).addEventListener("click", () => show(cur - 1));
    $(".lightbox__nav--next", lb).addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    let sx = null;
    lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    });
    addEventListener("keydown", e => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  /* ---------- modo página única: abrir/fechar projeto ---------- */
  const baseTitle = document.title;
  function openProject(slug) {
    renderProject(slug, spaView);
    homeView.hidden = true;
    spaView.hidden = false;
    observe(spaView);
    lenis && lenis.resize && lenis.resize();
    scrollToY(0, true);
    try { history.replaceState(null, "", "#" + slug); } catch (e) {}
    requestAnimationFrame(onScroll);
  }
  function closeProject() {
    spaView.hidden = true;
    spaView.innerHTML = "";
    homeView.hidden = false;
    document.title = baseTitle;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    onScroll();
  }
  if (SPA && bySlug(location.hash.slice(1))) openProject(location.hash.slice(1));

  /* ==========================================================
     Render do projeto
     ========================================================== */
  function renderProject(slug, main) {
    const i = PROJECTS.findIndex(p => p.slug === slug);
    const p = PROJECTS[i], next = PROJECTS[(i + 1) % PROJECTS.length];
    document.title = `${p.title} — Tey Romeiro Arquitetura`;
    const md = $('meta[name="description"]'); md && (md.content = p.lead);
    lbItems = p.gallery;

    const handle = s => s.replace(/@([\w.]+)/g, (m, h) => `<a href="https://www.instagram.com/${h}/" target="_blank" rel="noopener">${m}</a>`);
    const facts = [
      p.place && ["Localização", p.place],
      ["Tipologia", p.category],
      p.year && ["Ano", p.year],
      p.area && ["Área", p.area],
      p.status && ["Status", p.status],
      ["Escopo", p.tags.join(" · ")],
      ...p.credits
    ].filter(Boolean);

    main.innerHTML = `
      <div class="container">
        <div class="p-head">
          <div>
            <span class="label label--dash">${p.category}${p.place ? " · " + p.place : ""}</span>
            <h1 class="title">${p.title}</h1>
          </div>
          <a href="${homeHref("projetos")}" class="link-line">← Todos os projetos</a>
        </div>
        <div class="p-cover"><img src="${p.cover}" alt="${p.title}" style="object-position:${p.heroPos || "center"}"></div>
      </div>

      <section class="section">
        <div class="container p-intro">
          <aside class="p-facts reveal">
            <h2 class="label">Ficha técnica</h2>
            <dl>${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${handle(String(v))}</dd></div>`).join("")}</dl>
          </aside>
          <div class="p-text">
            <p class="statement reveal">${p.lead}</p>
            ${p.text.map((t, j) => `<p class="${j === 0 ? "body-lg" : ""} reveal">${t}</p>`).join("")}
          </div>
        </div>
      </section>

      <section style="padding-bottom:clamp(56px,7vw,100px)">
        <div class="container gallery">
          ${p.gallery.map((g, j) => `<figure class="g-item${g.layout ? " g-item--" + g.layout : ""} reveal-img" data-i="${j}"><img src="${g.src}" alt="${g.alt || ""}" loading="lazy"></figure>`).join("")}
        </div>
      </section>

      <section class="section--tight p-cta">
        <div class="container">
          <p class="title reveal">Tem um projeto em mente? Vamos conversar.</p>
          <a class="btn btn--solid reveal" href="${WA}?text=${encodeURIComponent(`Olá! Vi o projeto ${p.title} no site e gostaria de conversar sobre um projeto.`)}" target="_blank" rel="noopener">Falar com o escritório</a>
        </div>
      </section>

      <div class="container">
        <a class="p-next" href="${projectHref(next.slug)}">
          <div>
            <span class="label label--dash">Próximo projeto</span>
            <p class="title">${next.title}</p>
            <span class="link-line">Ver projeto →</span>
          </div>
          <div class="p-next__media"><img src="${next.cover}" alt="" loading="lazy" style="object-position:${next.heroPos || "center"}"></div>
        </a>
      </div>`;

    // galeria: itens sem layout definido seguem o ritmo 1 grande + 2 iguais
    rhythm($$(".g-item", main).filter(el => !/g-item--/.test(el.className) || el.classList.contains("g-item--full")), "g-item--full");
  }
})();
