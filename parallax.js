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

  // Versão mobile do parallax: sem pin (travar o scroll pra um elemento que
  // não está no topo da tela é frágil — tentei e o preview pulava pra baixo).
  // Em vez disso, o preview sobe de verdade por cima do texto via transform
  // (translateY até a posição do texto), enquanto o texto desaparece — puro
  // scrub ligado ao scroll, sem prender nada.
  function initMobileTitleFade() {
    var text = document.querySelector(".hero-text");
    var media = document.querySelector(".hero-media");
    var cta = document.querySelector(".hero-cta");
    var tint = document.querySelector(".hero-bg-tint");
    if (!text || !media) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Distância entre o topo do texto e o topo do preview — é quanto o
    // preview precisa subir pra cobrir exatamente onde o texto está.
    var moveDistance = media.getBoundingClientRect().top - text.getBoundingClientRect().top;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=" + Math.round(window.innerHeight * 0.6),
        scrub: true
      }
    })
      .to(text, { autoAlpha: 0, y: -30, ease: "none" }, 0)
      .to(media, { y: -moveDistance, ease: "none" }, 0);

    // Os botões sobem junto com o preview, na mesma distância — sem isso eles
    // ficavam parados no lugar de origem enquanto o preview subia, abrindo um
    // vão enorme entre os dois (o transform não empurra o resto do layout).
    if (cta) tl.to(cta, { y: -moveDistance, ease: "none" }, 0);

    if (tint) tl.to(tint, { opacity: 1, ease: "none" }, 0);
  }

  function init() {
    initMobileReveal();

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      window.setTimeout(init, 150);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    if (window.innerWidth <= 1200) {
      initMobileTitleFade();
      return;
    }

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
