(function () {
  // Mobile não usa o pin/scale do GSAP (quebra o layout empilhado), mas ganha
  // uma entrada leve: o preview nasce um pouco abaixo e sobe suavemente quando
  // entra na viewport — um "parallax" seguro, sem prender o scroll.
  function initMobileReveal() {
    if (window.innerWidth > 760) return;
    var media = document.querySelector(".hero-media");
    if (!media || media.dataset.revealInit) return;
    media.dataset.revealInit = "1";
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    media.style.transform = "translateY(28px)";
    media.style.opacity = "0";
    media.style.transition = "transform .7s cubic-bezier(.2,.7,.3,1), opacity .7s ease";

    if (!("IntersectionObserver" in window)) {
      media.style.transform = "none";
      media.style.opacity = "1";
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        media.style.transform = "translateY(0)";
        media.style.opacity = "1";
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    io.observe(media);
  }

  // Luz que segue o cursor no fundo da hero — só em telas com mouse de
  // verdade (hover+pointer fine), sem efeito nenhum em touch.
  function initSpotlight(containerSel, spotSel) {
    var container = document.querySelector(containerSel);
    var spot = document.querySelector(spotSel);
    if (!container || !spot || container.dataset.spotlightInit) return;
    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;
    container.dataset.spotlightInit = "1";

    var raf = null;
    var pending = null;

    function apply() {
      raf = null;
      if (!pending) return;
      container.style.setProperty("--sx", pending.x + "px");
      container.style.setProperty("--sy", pending.y + "px");
      pending = null;
    }

    container.addEventListener("mousemove", function (e) {
      var rect = container.getBoundingClientRect();
      pending = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!raf) raf = requestAnimationFrame(apply);
    });
    container.addEventListener("mouseenter", function () { spot.classList.add("is-active"); });
    container.addEventListener("mouseleave", function () { spot.classList.remove("is-active"); });
  }

  function init() {
    initMobileReveal();
    initSpotlight(".hero", ".hero-spotlight");

    // Parallax (pin + fade do título) é só de desktop — no mobile o layout
    // fica todo empilhado normal, sem GSAP nenhum.
    if (window.innerWidth <= 1200) return;

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      window.setTimeout(init, 150);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    var title = document.querySelector(".hero-stage-title");
    var mosaic = document.querySelector(".hero-stage-mosaic");
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
      // Sobe um pouco além do repouso natural (y:0) — sem isso, com o título
      // sumindo, sobrava um vão vazio grande entre a navbar e o mosaico.
      .to(mosaic, { y: -80, scale: 1, ease: "power1.inOut" }, 0.1);
  }

  init();
})();
