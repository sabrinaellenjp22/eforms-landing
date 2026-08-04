(function () {
  var navbar = document.querySelector(".navbar");
  var hero = document.querySelector(".hero");
  if (!navbar || !hero) return;

  var navHeight = navbar.offsetHeight;
  document.documentElement.style.setProperty("--nav-h", navHeight + "px");

  var threshold = 40;
  var isFixed = false;

  function onScroll() {
    var shouldFix = window.scrollY > threshold;
    if (shouldFix !== isFixed) {
      isFixed = shouldFix;
      navbar.classList.toggle("is-fixed", isFixed);
      hero.classList.toggle("nav-reserve", isFixed);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

(function () {
  var toggle = document.querySelector(".nav-toggle");
  var navbar = document.querySelector(".navbar");
  if (!toggle || !navbar) return;

  function closeMenu() {
    navbar.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var isOpen = navbar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  navbar.querySelectorAll(".nav-pill a, .nav-actions a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
})();

(function () {
  var roots = document.querySelectorAll("[data-tabs-root]");
  if (!roots.length) return;

  var MOBILE_BP = 1200;

  roots.forEach(function (root) {
    var tabs = root.querySelectorAll(".feature-row[data-tab]");
    var panels = root.querySelectorAll(".product-styles[data-panel]");
    var productRight = root.querySelector(".product-right");
    if (!tabs.length || !panels.length || !productRight) return;

    var isMobileLayout = null;

    function panelFor(tab) {
      var target = tab.getAttribute("data-tab");
      for (var i = 0; i < panels.length; i++) {
        if (panels[i].getAttribute("data-panel") === target) return panels[i];
      }
      return null;
    }

    // No mobile o preview vira "sanfona": sai da coluna fixa (.product-right) e
    // passa a viver logo depois do row clicado, dentro de .product-features.
    function placeInline(tab) {
      var panel = panelFor(tab);
      if (panel) tab.insertAdjacentElement("afterend", panel);
    }

    function syncLayout() {
      var shouldBeMobile = window.innerWidth <= MOBILE_BP;
      if (shouldBeMobile === isMobileLayout) return;
      isMobileLayout = shouldBeMobile;
      if (isMobileLayout) {
        tabs.forEach(function (t) {
          if (t.classList.contains("is-active")) placeInline(t);
        });
      } else {
        panels.forEach(function (p) { productRight.appendChild(p); });
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");

        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-panel") === target);
        });

        if (isMobileLayout) placeInline(tab);
      });
    });

    syncLayout();
    window.addEventListener("resize", syncLayout);
  });
})();

/* Animated stat counters — run once when the section scrolls into view.
   The final values are already in the HTML, so if this never runs
   (no JS, no IntersectionObserver, reduced motion) the numbers stay correct. */
(function () {
  var nums = document.querySelectorAll(".stat-num[data-count-to]");
  if (!nums.length) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  function format(value, el) {
    var out = String(value);
    if (el.getAttribute("data-sep")) out = value.toLocaleString("pt-BR");
    return (el.getAttribute("data-prefix") || "") + out + (el.getAttribute("data-suffix") || "");
  }

  function run(el) {
    var target = parseInt(el.getAttribute("data-count-to"), 10);
    if (isNaN(target)) return;

    var duration = 1600;
    var startedAt = null;

    function step(now) {
      if (startedAt === null) startedAt = now;
      var progress = Math.min((now - startedAt) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(Math.round(target * eased), el);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  nums.forEach(function (el) { io.observe(el); });
})();
