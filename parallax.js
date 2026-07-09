(function () {
  function init() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      window.setTimeout(init, 150);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    var title = document.querySelector(".hero-stage-title");
    var mosaic = document.querySelector(".hero-stage-mosaic");
    var tint = document.querySelector(".hero-bg-tint");
    if (!title || !mosaic) return;

    var peekOffset = mosaic.offsetHeight * 0.65;
    gsap.set(mosaic, { y: peekOffset, scale: 0.92 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=" + Math.round(window.innerHeight * 0.9),
        scrub: 0.6,
        pin: true
      }
    })
      .to(title, { autoAlpha: 0, y: -50, scale: 0.94, ease: "power1.inOut" }, 0)
      .to(mosaic, { y: 0, scale: 1, ease: "power1.inOut" }, 0.1);

    if (tint) {
      tl.to(tint, { opacity: 1, ease: "power1.inOut" }, 0);
    }
  }

  init();
})();
