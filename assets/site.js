/* ============================================================
   XARV — SITE ENGINE
   - Loads content.json (written by /admin). If missing or broken,
     the page keeps the text written in the HTML. Nothing breaks.
   - EN/AR toggle, cart, share, schemas, analytics, animations.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var PAGE = document.body.getAttribute("data-page") || "home";
  var DATA = null;
  var LANG = "en";
  try { LANG = localStorage.getItem("xarv-lang") || (((navigator.language || "en").toLowerCase().indexOf("ar") === 0) ? "ar" : "en"); } catch (e) {}

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function em(s) { return esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>"); }
  function T(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[LANG] != null ? obj[LANG] : (obj.en != null ? obj.en : "");
  }
  function ph(s) {
    var m = (DATA && DATA.meta) || {};
    var p = m.promise ? T(m.promise) : "within minutes";
    return String(s).replace(/\{promise\}/g, p).replace(/\{h\}/g, m.promiseHours || "24");
  }
  function get(path) {
    var cur = DATA;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }

  /* ---------- texts ---------- */
  function applyTexts() {
    $$("[data-e]").forEach(function (el) {
      var v = get(el.getAttribute("data-e"));
      if (v == null || v === "") return;
      el.innerHTML = em(ph(T(v)));
    });
  }

  /* ---------- lists ---------- */
  function host(name) { return $("[data-list='" + name + "']"); }

  function renderMarquee() {
    var h = host("marquee"); if (!h || !DATA.marquee) return;
    var one = DATA.marquee.map(function (m) { return "<span>" + esc(T(m)) + "</span>"; }).join("");
    h.innerHTML = one + one;
  }

  function serviceItem(s, i) {
    var title = T(s.title);
    var media = s.image
      ? '<div class="item-media"><img src="' + esc(s.image) + '" alt="' + esc(s.alt || title) + '" loading="lazy"></div>'
      : "";
    var price = s.price ? '<div class="item-price">' + esc(s.price) + "</div>" : "";
    return '<article class="item reveal in">' + media +
      '<div class="item-body"><div class="item-top"><span class="snum">S' + (i + 1) + "</span></div>" +
      "<h3>" + em(title) + "</h3>" +
      '<p class="desc">' + em(T(s.desc)) + "</p>" + price +
      '<div class="item-actions">' +
      '<button class="btn gold sm" data-add="' + esc(s.id) + '">' + esc(T(DATA.cart.addBtn)) + "</button>" +
      '<a class="btn sm" target="_blank" rel="noopener" href="' + waLink(title) + '">' + esc(T(DATA.cart.waBtn)) + "</a>" +
      "</div></div></article>";
  }
  function renderServices() {
    var h = host("services"); if (!h || !DATA.services) return;
    h.innerHTML = DATA.services.items.map(serviceItem).join("");
  }

  function renderCases() {
    var h = host("cases"); if (!h || !DATA.cases) return;
    var L = DATA.cases.labels;
    h.innerHTML = DATA.cases.items.map(function (c) {
      var chips = (c.stats || []).map(function (st) {
        return '<div class="chip"><span class="v">' + esc(st.v) + '</span><span class="l">' + esc(T(st.l)) + "</span></div>";
      }).join("");
      return '<article class="case reveal in">' +
        '<div class="case-top"><span class="case-tag">' + esc(T(c.tag)) + "</span>" +
        "<h3>" + em(T(c.title)) + "</h3>" +
        '<div class="case-stats">' + chips + "</div></div>" +
        '<div class="case-body">' +
        '<div class="case-row"><div class="lbl">' + esc(T(L.problem)) + "</div><p>" + em(T(c.problem)) + "</p></div>" +
        '<div class="case-row"><div class="lbl">' + esc(T(L.solution)) + "</div><p>" + em(T(c.solution)) + "</p></div>" +
        '<div class="case-row"><div class="lbl">' + esc(T(L.result)) + "</div><p>" + em(T(c.result)) + "</p></div>" +
        "</div></article>";
    }).join("");
  }

  function renderReviews() {
    var h = host("reviews"); if (!h || !DATA.reviews) return;
    h.innerHTML = DATA.reviews.items.map(function (r) {
      var n = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
      var stars = "";
      for (var i = 0; i < n; i++) stars += "★";
      return '<div class="review reveal in"><div class="stars" aria-label="' + n + ' out of 5">' + stars + "</div>" +
        '<span class="mark" aria-hidden="true">“</span>' +
        "<p>" + em(T(r.text)) + "</p>" +
        '<div class="who"><b>' + esc(T(r.author)) + "</b> · " + esc(T(r.detail)) + "</div></div>";
    }).join("");
  }

  function renderFaqs() {
    var h = host("faqs"); if (!h || !DATA.faq) return;
    h.innerHTML = DATA.faq.items.map(function (f) {
      return "<details><summary><span>" + em(T(f.q)) + '</span><span class="plus">+</span></summary>' +
        '<div class="faq-a">' + em(ph(T(f.a))) + "</div></details>";
    }).join("");
  }

  function renderSteps() {
    var h = host("steps"); if (!h || !DATA.process) return;
    h.innerHTML = DATA.process.steps.map(function (s) {
      return "<li><b>" + em(T(s.title)) + "</b>" + em(T(s.desc)) + "</li>";
    }).join("");
  }

  function renderTerm() {
    var h = host("termLines"); if (!h || !DATA.process) return;
    h.innerHTML = DATA.process.terminal.lines.map(function (l) {
      return '<div class="tline"><span class="p">›</span><span>' + esc(ph(T(l))) + "</span></div>";
    }).join("");
    var lines = $$(".tline", h);
    lines.forEach(function (l, i) { setTimeout(function () { l.classList.add("in"); }, 350 + i * 420); });
  }

  function renderStats() {
    var h = host("stats"); if (!h || !DATA.about) return;
    h.innerHTML = DATA.about.stats.map(function (s) {
      return '<div class="stat"><b>' + esc(ph(T(s.v))) + "</b><span>" + esc(T(s.l)) + "</span></div>";
    }).join("");
  }

  function renderFacts() {
    var h = host("facts"); if (!h || !DATA.about) return;
    h.innerHTML = DATA.about.facts.map(function (f) {
      return '<div class="fact"><b>' + esc(T(f.label)) + "</b><span>" + esc(T(f.value)) + "</span></div>";
    }).join("");
  }

  function renderPrivacy() {
    var h = host("privacySections"); if (!h || !DATA.pages) return;
    h.innerHTML = DATA.pages.privacy.sections.map(function (s) {
      return "<h2>" + em(T(s.h)) + '</h2><p class="body-p">' + em(ph(T(s.p))) + "</p>";
    }).join("");
  }

  /* ---------- links & images ---------- */
  function waDigits() { return String(DATA.meta.phoneDigits || "").replace(/[^0-9]/g, ""); }
  function waLink(text) {
    return "https://wa.me/" + waDigits() + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function applyLinks() {
    var m = DATA.meta;
    $$("a[data-wa]").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa") || ""); });
    $$("a[href^='mailto:']").forEach(function (a) {
      var q = a.getAttribute("href").split("?")[1];
      a.setAttribute("href", "mailto:" + m.email + (q ? "?" + q : ""));
    });
    $$("a[href^='tel:']").forEach(function (a) { a.setAttribute("href", "tel:+" + waDigits()); });
    $$("[data-ig]").forEach(function (a) {
      if (m.instagram) { a.setAttribute("href", m.instagram); a.style.display = ""; }
      else { a.style.display = "none"; }
    });
    $$("[data-img]").forEach(function (img) {
      var k = img.getAttribute("data-img");
      if (DATA.assets && DATA.assets[k]) img.setAttribute("src", DATA.assets[k]);
      if (k === "portrait" && DATA.assets && DATA.assets.portraitAlt) img.setAttribute("alt", DATA.assets.portraitAlt);
    });
  }

  /* ---------- theme overrides from admin ---------- */
  function applyTheme() {
    if (!DATA.theme) return;
    var t = DATA.theme;
    var css = ":root{--ink:" + t.bgDark + ";--gold:" + t.goldDark + ";--gold2:" + t.gold2Dark + "}" +
      "@media (prefers-color-scheme: light){:root{--ink:" + t.bgLight + ";--gold:" + t.goldLight + ";--gold2:" + t.gold2Light + "}}";
    var st = $("#themeOverrides");
    if (!st) { st = document.createElement("style"); st.id = "themeOverrides"; document.head.appendChild(st); }
    st.textContent = css;
  }

  /* ---------- seo / title ---------- */
  function applySeo() {
    if (!DATA.seo || !DATA.seo[PAGE]) return;
    var s = DATA.seo[PAGE];
    document.title = T(s.title);
    var md = $("meta[name='description']");
    if (md) md.setAttribute("content", T(s.desc));
    var ot = $("meta[property='og:title']");
    if (ot) ot.setAttribute("content", T(s.title));
    var od = $("meta[property='og:description']");
    if (od) od.setAttribute("content", T(s.desc));
  }

  /* ---------- structured data ---------- */
  function injectSchemas() {
    $$("script[data-xarv-schema]").forEach(function (s) { s.remove(); });
    var m = DATA.meta;
    var abs = function (p) { return p && p.indexOf("http") === 0 ? p : m.siteUrl.replace(/\/$/, "") + "/" + String(p || "").replace(/^\//, ""); };
    var list = [];
    var lb = {
      "@context": "https://schema.org", "@type": "ProfessionalService",
      "name": DATA.brand, "url": m.siteUrl, "email": m.email,
      "telephone": "+" + waDigits(),
      "image": abs(DATA.assets && DATA.assets.ogCover),
      "address": { "@type": "PostalAddress", "addressLocality": m.city, "addressCountry": "LB" },
      "areaServed": "Lebanon",
      "founder": { "@type": "Person", "name": m.founder },
      "description": T(DATA.seo.home.desc)
    };
    if (m.instagram) lb.sameAs = [m.instagram];
    if (DATA.reviews && DATA.reviews.items.length) {
      lb.review = DATA.reviews.items.map(function (r) {
        return {
          "@type": "Review",
          "reviewRating": { "@type": "Rating", "ratingValue": String(Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5))) },
          "reviewBody": T(r.text),
          "author": { "@type": "Person", "name": T(r.author) + " — " + T(r.detail) }
        };
      });
      lb.aggregateRating = { "@type": "AggregateRating", "ratingValue": "5", "reviewCount": String(DATA.reviews.items.length) };
    }
    list.push(lb);
    if (PAGE === "home" && DATA.faq && DATA.faq.items.length) {
      list.push({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": DATA.faq.items.map(function (f) {
          return { "@type": "Question", "name": T(f.q), "acceptedAnswer": { "@type": "Answer", "text": ph(T(f.a)) } };
        })
      });
    }
    if (PAGE !== "home") {
      var crumbs = [{ name: T(DATA.crumbs.home), url: m.siteUrl + "/" }];
      var labelMap = { privacy: DATA.pages.privacy.crumb, thankyou: DATA.pages.thankyou.crumb, notfound: { en: "404", ar: "404" } };
      crumbs.push({ name: T(labelMap[PAGE] || { en: PAGE }), url: m.siteUrl + "/" + (PAGE === "notfound" ? "404" : PAGE === "thankyou" ? "thank-you" : PAGE) });
      list.push({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": crumbs.map(function (c, i) {
          return { "@type": "ListItem", "position": i + 1, "name": c.name, "item": c.url };
        })
      });
    }
    list.forEach(function (obj) {
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-xarv-schema", "1");
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }

  /* ---------- analytics ---------- */
  var gaDone = false;
  function applyGa() {
    if (gaDone || !DATA.meta.gaId) return;
    gaDone = true;
    var id = DATA.meta.gaId.trim();
    if (!id) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }

  /* ---------- feature toggles ---------- */
  function applyFeatures() {
    var f = DATA.features || {};
    function show(sel, on) { $$(sel).forEach(function (el) { el.style.display = on ? "" : "none"; }); }
    show(".grain", f.grain !== false);
    show(".glow", f.glow !== false);
    show(".progress", f.progress !== false);
    show(".marquee", f.marquee !== false);
    show(".sticky-cta", f.stickyCta !== false);
    show(".cur", f.cursor !== false);
  }

  /* ---------- cart ---------- */
  function cartGet() {
    try { return JSON.parse(localStorage.getItem("xarv-cart") || "[]"); } catch (e) { return []; }
  }
  function cartSet(c) { try { localStorage.setItem("xarv-cart", JSON.stringify(c)); } catch (e) {} updateBadge(); }
  function updateBadge() {
    var n = cartGet().length;
    $$(".cart-count").forEach(function (b) { b.textContent = n; b.classList.toggle("on", n > 0); });
  }
  function cartOpen() { $("#cartDrawer").classList.add("on"); $("#cartOverlay").classList.add("on"); document.body.classList.add("lock"); }
  function cartClose() { $("#cartDrawer").classList.remove("on"); $("#cartOverlay").classList.remove("on"); document.body.classList.remove("lock"); }
  function renderCart() {
    var box = $("#cartItems"); if (!box) return;
    var ids = cartGet();
    var items = (DATA && DATA.services ? DATA.services.items : []);
    if (!ids.length) {
      box.innerHTML = '<div class="cart-empty">' + esc(DATA ? ph(T(DATA.cart.empty)) : "") + "</div>";
    } else {
      box.innerHTML = ids.map(function (id) {
        var s = items.filter(function (x) { return x.id === id; })[0];
        if (!s) return "";
        var title = T(s.title);
        return '<div class="cart-item"><span class="mono">' + esc(title.trim().charAt(0) || "X") + "</span>" +
          '<div class="info"><div class="t">' + esc(title) + "</div>" +
          (s.price ? '<div class="pr">' + esc(s.price) + "</div>" : "") +
          '</div><button class="rm" data-rm="' + esc(id) + '">' + esc(T(DATA.cart.remove)) + "</button></div>";
      }).join("");
    }
    var note = $("#cartNote"), btn = $("#cartCheckout");
    if (note && DATA) note.textContent = ph(T(DATA.cart.note));
    if (btn) btn.disabled = !ids.length;
  }
  function checkout() {
    var ids = cartGet();
    if (!ids.length || !DATA) return;
    var items = DATA.services.items.filter(function (s) { return ids.indexOf(s.id) > -1; });
    var lines = items.map(function (s) { return "• " + T(s.title) + (s.price ? " — " + s.price : ""); });
    var msg = T(DATA.cart.orderIntro) + "\n" + lines.join("\n");
    cartSet([]);
    window.open(waLink(msg), "_blank", "noopener");
    window.location.href = "thank-you.html";
  }
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) {
      var id = add.getAttribute("data-add");
      var c = cartGet();
      if (c.indexOf(id) === -1) c.push(id);
      cartSet(c);
      if (DATA) { var orig = T(DATA.cart.addedBtn); add.textContent = orig; setTimeout(function () { add.textContent = T(DATA.cart.addBtn); }, 1400); }
      renderCart();
      return;
    }
    var rm = e.target.closest("[data-rm]");
    if (rm) {
      cartSet(cartGet().filter(function (x) { return x !== rm.getAttribute("data-rm"); }));
      renderCart();
      return;
    }
    if (e.target.closest("#cartOpen") || e.target.closest("#cartOpen2")) { renderCart(); cartOpen(); }
    if (e.target.closest("#cartClose") || e.target.id === "cartOverlay") cartClose();
    if (e.target.closest("#cartCheckout")) checkout();
  });

  /* ---------- chrome interactions ---------- */
  function initChrome() {
    var nav = $("#nav");
    var prog = $("#progress");
    var sticky = $("#stickyCta");
    function onScroll() {
      var y = window.scrollY || 0;
      if (nav) nav.classList.toggle("scrolled", y > 10);
      if (prog) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      }
      if (sticky) sticky.classList.toggle("on", y > window.innerHeight * 0.55);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var menuBtn = $("#menuBtn"), navLinks = $("#navLinks");
    if (menuBtn && navLinks) {
      menuBtn.addEventListener("click", function () {
        var open = navLinks.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      navLinks.addEventListener("click", function (e) {
        if (e.target.tagName === "A") navLinks.classList.remove("open");
      });
    }

    if (!("IntersectionObserver" in window)) {
      $$(".reveal").forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      $$(".reveal").forEach(function (el) { io.observe(el); });
    }

    if (window.matchMedia("(hover:hover) and (pointer:fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var dot = $("#curDot"), ring = $("#curRing");
      if (dot && ring) {
        var rx = -100, ry = -100, tx = -100, ty = -100;
        document.addEventListener("mousemove", function (e) {
          tx = e.clientX; ty = e.clientY;
          dot.style.left = tx + "px"; dot.style.top = ty + "px";
        });
        (function loop() {
          rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
          ring.style.left = rx + "px"; ring.style.top = ry + "px";
          requestAnimationFrame(loop);
        })();
        document.addEventListener("mouseover", function (e) {
          ring.classList.toggle("big", !!e.target.closest("a,button,summary,.item,.case,.review"));
        });
      }
    }
  }

  /* ---------- language ---------- */
  function setLang(l, save) {
    LANG = l;
    if (save) { try { localStorage.setItem("xarv-lang", l); } catch (e) {} }
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    if (DATA) applyAll();
  }
  function initLangToggle() {
    $$("#langToggle,#langToggle2").forEach(function (b) {
      b.addEventListener("click", function () { setLang(LANG === "ar" ? "en" : "ar", true); });
    });
  }

  /* ---------- apply everything ---------- */
  function applyAll() {
    applyTheme();
    applyFeatures();
    applyTexts();
    renderMarquee();
    renderServices();
    renderCases();
    renderReviews();
    renderFaqs();
    renderSteps();
    renderTerm();
    renderStats();
    renderFacts();
    renderPrivacy();
    applyLinks();
    applySeo();
    injectSchemas();
    applyGa();
    updateBadge();
  }

  /* ---------- boot ---------- */
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  initChrome();
  initLangToggle();
  updateBadge();

  if (PAGE === "thankyou") cartSet([]);

  var draft = null;
  try { draft = localStorage.getItem("xarv-admin-draft"); } catch (e) {}
  var source = draft
    ? Promise.resolve(draft)
    : fetch("content.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.text(); });

  source.then(function (text) {
    try {
      var parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") { DATA = parsed; applyAll(); }
    } catch (e) {
      var lb = $("#langToggle"); if (lb) lb.style.display = "none";
    }
  }).catch(function () {
    var lb = $("#langToggle"); if (lb) lb.style.display = "none";
  });
})();
