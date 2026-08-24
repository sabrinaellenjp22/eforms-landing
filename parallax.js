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

  // Luz que segue o cursor no fundo da hero + sections seguintes — só em
  // telas com mouse de verdade (hover+pointer fine), sem efeito em touch.
  // Um único listener global (em vez de um por section) trata as sections
  // como uma faixa contínua: todas ficam ativas juntas enquanto o cursor
  // estiver em qualquer ponto entre o topo da primeira e o fim da última,
  // cada uma calculando sua posição relativa — assim o brilho vaza de uma
  // pra outra em vez de sumir de repente na borda.
  function initSpotlightGroup(containerSel, spotSel) {
    var containers = Array.prototype.slice.call(document.querySelectorAll(containerSel));
    var pairs = containers
      .map(function (c) { return { container: c, spot: c.querySelector(spotSel) }; })
      .filter(function (p) { return p.spot; });
    if (!pairs.length || pairs[0].container.dataset.spotlightGroupInit) return;
    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;
    pairs[0].container.dataset.spotlightGroupInit = "1";

    var raf = null;
    var pending = null;

    function apply() {
      raf = null;
      if (!pending) return;
      var x = pending.x, y = pending.y;
      pending = null;
      var top = pairs[0].container.getBoundingClientRect().top;
      var bottom = pairs[pairs.length - 1].container.getBoundingClientRect().bottom;
      var active = y >= top && y <= bottom;
      pairs.forEach(function (p) {
        var rect = p.container.getBoundingClientRect();
        p.spot.style.setProperty("--sx", (x - rect.left) + "px");
        p.spot.style.setProperty("--sy", (y - rect.top) + "px");
        p.spot.classList.toggle("is-active", active);
      });
    }

    document.addEventListener("mousemove", function (e) {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  function init() {
    initMobileReveal();
    initSpotlightGroup(".hero, .sec-features, .product", ".hero-spotlight");

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
