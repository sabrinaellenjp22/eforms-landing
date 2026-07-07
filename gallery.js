(function () {
  var images = [
    "assets/hero.png",
    "assets/hero-2.jpg"
  ];

  var container = document.getElementById("heroGallery");
  if (!container) return;

  var AUTOPLAY_MS = 4500;
  var FLIP_DURATION = 1.1;

  var layers = images.map(function (url, i) {
    var el = document.createElement("div");
    el.className = "hero-gallery-layer";
    el.style.backgroundImage = "url(" + url + ")";
    el.style.zIndex = String(images.length - i);
    el.style.clipPath = "circle(" + (i === 0 ? "110%" : "0%") + " at 50% 50%)";
    container.appendChild(el);
    return { el: el, state: { r: i === 0 ? 110 : 0 } };
  });

  var openIndex = 0;

  function setClip(layer) {
    layer.el.style.clipPath = "circle(" + layer.state.r + "% at 50% 50%)";
  }

  function playOpen(layer) {
    layer.el.style.zIndex = "3";
    gsap.to(layer.state, {
      r: 110,
      duration: FLIP_DURATION,
      ease: "power2.inOut",
      onUpdate: function () { setClip(layer); }
    });
  }

  function playClose(layer) {
    gsap.to(layer.state, {
      r: 0,
      duration: FLIP_DURATION,
      ease: "power2.inOut",
      onUpdate: function () { setClip(layer); },
      onComplete: function () {
        layer.el.style.zIndex = "1";
      }
    });
  }

  function next() {
    var nextIndex = (openIndex + 1) % layers.length;
    playOpen(layers[nextIndex]);
    playClose(layers[openIndex]);
    openIndex = nextIndex;
  }

  function init() {
    if (typeof gsap === "undefined") {
      window.setTimeout(init, 150);
      return;
    }
    window.setInterval(next, AUTOPLAY_MS);
  }

  init();
})();
