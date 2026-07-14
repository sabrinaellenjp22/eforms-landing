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

/* FAQ accordion — opening one item closes the previously open one */
(function () {
  var items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      items.forEach(function (other) {
        if (other !== item && other.open) other.open = false;
      });
    });
  });
})();
