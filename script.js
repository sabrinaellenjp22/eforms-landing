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
  var tabs = document.querySelectorAll(".feature-row[data-tab]");
  var panels = document.querySelectorAll(".product-styles[data-panel]");
  if (!tabs.length || !panels.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");

      tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === target);
      });
    });
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

/* Problem demos idle while the section is off screen.
   Animations run by default, so nothing breaks if this never executes. */
(function () {
  var sec = document.querySelector(".sec-problem");
  if (!sec || !("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      sec.classList.toggle("is-paused", !entry.isIntersecting);
    });
  }, { threshold: 0.2 });

  io.observe(sec);
})();
