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

/* FAQ — accordion exclusivo: abrir uma pergunta fecha as outras para manter padrão de altura constante */
(function () {
  var items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach(function (item) {
    var btn = item.querySelector(".faq-summary");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isCurrentlyOpen = item.classList.contains("is-open");

      // Se for abrir o item atual, fecha todos os outros itens abertos
      if (!isCurrentlyOpen) {
        items.forEach(function (other) {
          if (other !== item && other.classList.contains("is-open")) {
            other.classList.remove("is-open");
            var otherBtn = other.querySelector(".faq-summary");
            if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          }
        });
      }

      var newState = !isCurrentlyOpen;
      item.classList.toggle("is-open", newState);
      btn.setAttribute("aria-expanded", String(newState));
    });
  });
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
    var productFeatures = root.querySelector(".product-features");
    if (!tabs.length || !panels.length || !productRight) return;

    // Nas Problemáticas os textos de cada aba têm tamanhos diferentes; sem
    // travar a altura do painel direito na altura do menu (sempre com as
    // mesmas 5 linhas), o card inteiro cresce/encolhe ao trocar de aba.
    var lockHeight = root.closest(".sec-problematicas") !== null;
    // No Produto e funcionamento os previews (builder/componentes/estilos/
    // registros) variam demais de altura entre si — em vez de tentar encaixar
    // isso "sanfonado" dentro do menu (o que sempre sobrava/cortava espaço),
    // no mobile eles abrem num modal por cima, com altura livre e scroll.
    var useModal = root.closest(".product") !== null;

    var isMobileLayout = null;
    var phoneSlot = root.parentElement && root.parentElement.querySelector(".product-phone-slot");
    var phoneSlotImg = phoneSlot && phoneSlot.querySelector("img");
    var hasTabImages = Array.prototype.some.call(tabs, function (t) { return t.hasAttribute("data-image"); });

    var modal = useModal ? document.querySelector(".preview-modal") : null;
    var modalBody = modal && modal.querySelector(".preview-modal-body");
    var modalTitle = modal && modal.querySelector(".preview-modal-title");

    function openModal(tab) {
      var panel = panelFor(tab);
      if (!modal || !modalBody || !panel) return;
      modalBody.appendChild(panel);
      var label = tab.querySelector(".feature-copy strong");
      if (modalTitle) modalTitle.textContent = label ? label.textContent : "";
      modal.classList.add("is-open");
      document.body.classList.add("preview-modal-lock");
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      document.body.classList.remove("preview-modal-lock");
    }

    // Troca a imagem ao lado do card quando a aba clicada define data-image
    // (hoje só usado nas Problemáticas — nas outras abas o atributo não existe,
    // então isso não faz nada).
    function syncImage(tab) {
      var src = tab.getAttribute("data-image");
      if (!src || !phoneSlotImg) return;
      phoneSlotImg.src = src;
      phoneSlotImg.alt = tab.getAttribute("data-image-alt") || phoneSlotImg.alt;
    }

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

    // Só nas Problemáticas (tabs com data-image): no mobile a foto entra
    // dentro do próprio painel, acima do texto, logo abaixo do item clicado —
    // assim a troca de imagem fica visível sem precisar rolar até o fim do menu.
    function placeImageInline(tab) {
      if (!hasTabImages || !phoneSlot) return;
      var panel = panelFor(tab);
      var innerPanel = panel && panel.querySelector(".problem-panel");
      if (innerPanel) innerPanel.insertBefore(phoneSlot, innerPanel.firstChild);
    }

    // Trava a altura direto na caixa de vidro (em vez de depender da cadeia de
    // porcentagem flex > grid > flex, que nem sempre propaga a altura entre
    // esses layouts encadeados) — assim ela sempre bate com o menu, e a foto
    // ao lado trava na altura total do card (não só do "stretch" do flex).
    // Só roda no desktop — no mobile ninguém mais precisa de altura travada:
    // Problemáticas fica com o texto no tamanho natural, e o Produto e
    // funcionamento abre num modal com altura livre (ver useModal acima).
    function syncPanelHeight() {
      if (!productFeatures) return;

      if (isMobileLayout) {
        productRight.style.removeProperty("height");
        if (phoneSlot) phoneSlot.style.removeProperty("height");
        panels.forEach(function (p) {
          p.style.removeProperty("height");
          var innerPanel = p.querySelector(".problem-panel");
          if (innerPanel) innerPanel.style.removeProperty("height");
        });
        return;
      }

      if (!lockHeight) return;
      var h = productFeatures.offsetHeight + "px";
      productRight.style.height = h;
      panels.forEach(function (p) {
        var innerPanel = p.querySelector(".problem-panel");
        if (innerPanel) innerPanel.style.height = h;
      });
      if (phoneSlot) phoneSlot.style.height = root.offsetHeight + "px";
    }

    function syncLayout() {
      var shouldBeMobile = window.innerWidth <= MOBILE_BP;
      if (shouldBeMobile !== isMobileLayout) {
        isMobileLayout = shouldBeMobile;
        if (isMobileLayout) {
          if (!useModal) {
            tabs.forEach(function (t) {
              if (t.classList.contains("is-active")) {
                placeInline(t);
                placeImageInline(t);
              }
            });
          }
        } else {
          closeModal();
          panels.forEach(function (p) { productRight.appendChild(p); });
          if (hasTabImages && phoneSlot) root.parentElement.appendChild(phoneSlot);
        }
      }
      syncPanelHeight();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");

        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-panel") === target);
        });
        syncImage(tab);

        if (isMobileLayout) {
          if (useModal) {
            openModal(tab);
          } else {
            placeInline(tab);
            placeImageInline(tab);
          }
        }
      });
    });

    if (modal) {
      var closeBtn = modal.querySelector(".preview-modal-close");
      var backdrop = modal.querySelector(".preview-modal-backdrop");
      if (closeBtn) closeBtn.addEventListener("click", closeModal);
      if (backdrop) backdrop.addEventListener("click", closeModal);
    }

    syncLayout();
    window.addEventListener("resize", syncLayout);
  });
})();

/* Tag "Personalize sua marca" — a cor da tag e a screenshot do mockup trocam
   juntas, no mesmo timer, pra ficarem sempre sincronizadas. */
(function () {
  var kicker = document.querySelector(".customize-copy .sec-kicker");
  var frame = document.querySelector(".laptop-shot-frame");
  if (!kicker || !frame) return;
  var layers = frame.querySelectorAll(".laptop-shot");
  if (layers.length < 2) return;

  var steps = [
    { color: "var(--blue)",   src: "assets/customize-preview.png" },
    { color: "var(--red)",    src: "assets/customize-preview-red.jpg" },
    { color: "var(--green)",  src: "assets/customize-preview-green.jpg" },
    { color: "var(--gold)",   src: "assets/customize-preview-gold.jpg" },
    { color: "var(--purple)", src: "assets/customize-preview-purple.jpg" },
    { color: "var(--pink)",   src: "assets/customize-preview-pink.jpg" },
    { color: "var(--orange)", src: "assets/customize-preview-orange.jpg" },
    { color: "var(--slate)",  src: "assets/customize-preview-slate.jpg" }
  ];

  // Pré-carrega tudo uma vez, pra nenhuma troca depender de rede no meio do ciclo.
  steps.forEach(function (s) { var im = new Image(); im.src = s.src; });

  var index = 0;
  var activeLayer = layers[0];
  var hiddenLayer = layers[1];

  // Estado inicial (azul) já é o que está nas duas camadas — só marca a cor da tag.
  kicker.style.background = steps[0].color;

  window.setInterval(function () {
    index = (index + 1) % steps.length;
    var step = steps[index];

    kicker.style.background = step.color;
    hiddenLayer.src = step.src;
    hiddenLayer.classList.add("is-active");
    activeLayer.classList.remove("is-active");

    var swap = activeLayer;
    activeLayer = hiddenLayer;
    hiddenLayer = swap;
  }, 2800);
})();

/* Dock de ícones — aumenta o item sob o mouse e os vizinhos próximos
   (estilo dock do macOS), com tamanho decrescendo pela distância no índice. */
(function () {
  var dock = document.querySelector(".dock-nav");
  if (!dock) return;
  var items = dock.querySelectorAll(".dock-item");
  if (!items.length) return;

  var SIZE = { base: 64, far: 72, close: 84, active: 96 };
  // Sem mouse de verdade (touch), o "magnify" não faz sentido — sem mouseleave
  // real, o ícone tocado ficaria preso grande. Nesses dispositivos só alterna
  // o tooltip no toque, sem redimensionar.
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function sizeFor(distance) {
    if (distance === 0) return SIZE.active;
    if (distance === 1) return SIZE.close;
    if (distance === 2) return SIZE.far;
    return SIZE.base;
  }

  function apply(activeIndex) {
    items.forEach(function (item, i) {
      if (canHover) {
        var size = activeIndex === -1 ? SIZE.base : sizeFor(Math.abs(i - activeIndex));
        item.style.width = size + "px";
        item.style.height = size + "px";
      }
      item.classList.toggle("is-active", i === activeIndex);
    });
  }

  if (canHover) {
    items.forEach(function (item, i) {
      item.addEventListener("mouseenter", function () { apply(i); });
    });
    dock.addEventListener("mouseleave", function () { apply(-1); });
  } else {
    items.forEach(function (item, i) {
      item.addEventListener("click", function () {
        apply(item.classList.contains("is-active") ? -1 : i);
      });
    });
  }

  apply(-1);
})();

/* Carrossel de "Principais funcionalidades" no mobile — 1 card por vez, com
   sobreposição (crossfade), mesma linguagem do preview do notebook em
   "Personalize sua marca". Nada de scroll/drag nativo. Avança sozinho por
   timer, e clicar num ponto também navega e reinicia o timer. No desktop
   (grid) as classes "is-active" não têm efeito nenhum via CSS. */
(function () {
  var track = document.querySelector(".features-bento");
  var dots = document.querySelectorAll(".features-dot");
  var tiles = document.querySelectorAll(".feature-tile");
  if (!track || !dots.length || !tiles.length) return;

  var mqMobile = window.matchMedia("(max-width: 720px)");
  var mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var index = 0;
  var timer = null;

  function render() {
    tiles.forEach(function (tile, i) { tile.classList.toggle("is-active", i === index); });
    dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === index); });
  }

  function goTo(i) {
    index = (i + tiles.length) % tiles.length;
    render();
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startAuto() {
    stopAuto();
    if (!mqMobile.matches || mqReduced.matches) return;
    timer = setInterval(function () { goTo(index + 1); }, 4500);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      goTo(i);
      startAuto();
    });
  });

  function onBreakpointChange() {
    index = 0;
    render();
    startAuto();
  }
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", onBreakpointChange);

  render();
  startAuto();
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

/* Surgimento ao rolar — fade + leve subida, uma vez por elemento.
   Itens dentro de um [data-reveal-group] escalonam via delay pela posição
   entre os irmãos, sem precisar calcular nada manualmente no HTML. */
(function () {
  var els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var group = el.closest("[data-reveal-group]");
      if (group) {
        var siblings = Array.prototype.filter.call(group.children, function (c) {
          return c.hasAttribute("data-reveal");
        });
        el.style.transitionDelay = (siblings.indexOf(el) * 80) + "ms";
      }
      el.classList.add("is-visible");
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

  // Espera o navegador pintar o estado escondido pelo menos uma vez antes de
  // observar — sem isso, elementos já visíveis no primeiro frame (ex: logo
  // abaixo da hero) disparam o "is-visible" antes de existir um "escondido"
  // pintado pra transicionar a partir dele, e aparecem sem fade nenhum.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      els.forEach(function (el) { io.observe(el); });
    });
  });
})();
