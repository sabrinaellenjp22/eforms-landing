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

  // Seta abaixo do subtítulo. No mobile (sem parallax) leva até o fim da
  // própria hero, mostrando o preview já revelado sem sobrar espaço vazio
  // embaixo. No desktop leva até o fim do parallax (preview totalmente
  // revelado), não direto pra próxima section. Sempre com scroll suave.
  function initScrollCue() {
    var cue = document.querySelector(".hero-scroll-cue");
    if (!cue || cue.dataset.scrollCueInit) return;
    cue.dataset.scrollCueInit = "1";
    cue.addEventListener("click", function (e) {
      e.preventDefault();
      var hero = document.querySelector(".hero");
      var target;
      if (window.innerWidth <= 1200 || !hero) {
        target = hero
          ? Math.round(hero.offsetTop + hero.offsetHeight - window.innerHeight)
          : Math.round(window.innerHeight * 0.6);
      } else {
        target = Math.round(window.innerHeight * 0.9);
      }
      window.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
    });
  }

  // "Neural Noise" — porte do componente React/WebGL enviado (mesmo par de
  // shaders), adaptado pra vanilla JS. Virou uma factory reaproveitada em 3
  // lugares (hero, Personalize sua marca, Integrações): cada instância tem
  // seu próprio canvas restrito ao container, ponteiro normalizado pelo
  // retângulo do container (o original usava a janela inteira, mas aqui cada
  // canvas só cobre a própria section) e uma lista de "zonas proibidas"
  // (mockup, texto, CTA...) que o ruído não pode invadir — até 3 caixas,
  // recalculadas a cada frame pra acompanhar reflow/resize/digitação.
  var MAX_AVOID = 3;

  function createNeuralNoise(config) {
    var container = document.querySelector(config.container);
    var canvas = document.querySelector(config.canvas);
    if (!container || !canvas || canvas.dataset.noiseInit) return;
    canvas.dataset.noiseInit = "1";

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    var OPACITY = config.opacity || 0.95;
    var POINTER_STRENGTH = 1.0;
    var TIME_SCALE = 1.0;
    var colorA = config.colorA;
    var colorB = config.colorB || config.colorA;
    var cycleColor = !!config.cycleColor;

    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    var VERT = [
      "precision mediump float;",
      "attribute vec2 a_position;",
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = 0.5 * (a_position + 1.0);",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    var FRAG = [
      "precision mediump float;",
      "varying vec2 vUv;",
      "uniform float u_time;",
      "uniform float u_ratio;",
      "uniform vec2  u_pointer_position;",
      "uniform float u_pointer_strength;",
      "uniform float u_time_scale;",
      "uniform vec3  u_colorA;",
      "uniform vec3  u_colorB;",
      "uniform float u_color_mix;",
      "uniform vec4  u_avoid0;",
      "uniform vec4  u_avoid1;",
      "uniform vec4  u_avoid2;",

      "vec2 rotate(vec2 uv, float th) {",
      "  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;",
      "}",

      "float neuro_shape(vec2 uv, float t, float p) {",
      "  vec2 sine_acc = vec2(0.0);",
      "  vec2 res = vec2(0.0);",
      "  float scale = 8.0;",

      "  for (int j = 0; j < 15; j++) {",
      "    uv = rotate(uv, 1.0);",
      "    sine_acc = rotate(sine_acc, 1.0);",
      "    vec2 layer = uv * scale + float(j) + sine_acc - t;",
      "    sine_acc += sin(layer) + 2.4 * p;",
      "    res += (0.5 + 0.5 * cos(layer)) / scale;",
      "    scale *= 1.2;",
      "  }",
      "  return res.x + res.y;",
      "}",

      // Máscara retangular com borda suave: 1.0 fora da caixa (ruído normal),
      // 0.0 dentro/perto dela. Caixas não usadas ficam com um valor
      // sentinela (-1,-1,-1,-1) que nunca intersecta vUv (sempre 0..1).
      "float boxMask(vec4 box, vec2 uv) {",
      "  float dx = max(box.x - uv.x, uv.x - box.z);",
      "  float dy = max(box.y - uv.y, uv.y - box.w);",
      "  return smoothstep(0.0, 0.1, max(dx, dy));",
      "}",

      "void main() {",
      "  vec2 uv = 0.5 * vUv;",
      "  uv.x *= u_ratio;",

      "  vec2 pointer = vUv - u_pointer_position;",
      "  pointer.x *= u_ratio;",
      "  float p = clamp(length(pointer), 0.0, 1.0);",
      "  p = 0.5 * pow(1.0 - p, 2.0) * u_pointer_strength;",

      "  float t = 0.001 * u_time * u_time_scale;",

      "  float noise = neuro_shape(uv, t, p);",
      "  noise = 1.2 * pow(noise, 3.0);",
      "  noise += pow(noise, 10.0);",
      "  noise = max(0.0, noise - 0.5);",
      "  noise *= (1.0 - length(vUv - 0.5));",

      "  noise *= boxMask(u_avoid0, vUv) * boxMask(u_avoid1, vUv) * boxMask(u_avoid2, vUv);",

      "  vec3 base = mix(u_colorA, u_colorB, u_color_mix);",
      "  vec3 color = base * noise;",
      "  gl_FragColor = vec4(color, noise);",
      "}"
    ].join("\n");

    function compile(src, type) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vs = compile(VERT, gl.VERTEX_SHADER);
    var fs = compile(FRAG, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    var vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uniforms = {
      u_time: gl.getUniformLocation(program, "u_time"),
      u_ratio: gl.getUniformLocation(program, "u_ratio"),
      u_pointer_position: gl.getUniformLocation(program, "u_pointer_position"),
      u_pointer_strength: gl.getUniformLocation(program, "u_pointer_strength"),
      u_time_scale: gl.getUniformLocation(program, "u_time_scale"),
      u_colorA: gl.getUniformLocation(program, "u_colorA"),
      u_colorB: gl.getUniformLocation(program, "u_colorB"),
      u_color_mix: gl.getUniformLocation(program, "u_color_mix"),
      u_avoid: [
        gl.getUniformLocation(program, "u_avoid0"),
        gl.getUniformLocation(program, "u_avoid1"),
        gl.getUniformLocation(program, "u_avoid2")
      ]
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1f(uniforms.u_pointer_strength, POINTER_STRENGTH);
    gl.uniform1f(uniforms.u_time_scale, TIME_SCALE);
    gl.uniform3f(uniforms.u_colorA, colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(uniforms.u_colorB, colorB[0], colorB[1], colorB[2]);

    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var scrollProgress = 0;

    var avoidEls = (config.avoidSelectors || [])
      .map(function (sel) { return container.querySelector(sel); })
      .filter(Boolean)
      .slice(0, MAX_AVOID);
    // xMin, yMin, xMax, yMax por caixa, em coordenadas de vUv (0..1, de baixo
    // pra cima). Sentinela (-1,-1,-1,-1) = caixa inativa/fora da tela.
    var avoidBoxes = [];
    for (var i = 0; i < MAX_AVOID; i++) avoidBoxes.push([-1, -1, -1, -1]);

    function updateAvoidBoxes() {
      var rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var pad = 24;
      avoidEls.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        var x0 = (r.left - rect.left - pad) / rect.width;
        var x1 = (r.right - rect.left + pad) / rect.width;
        var topN = (r.top - rect.top - pad) / rect.height;
        var bottomN = (r.bottom - rect.top + pad) / rect.height;
        avoidBoxes[i][0] = x0;
        avoidBoxes[i][1] = 1 - bottomN;
        avoidBoxes[i][2] = x1;
        avoidBoxes[i][3] = 1 - topN;
      });
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.floor(container.clientWidth * dpr);
      var h = Math.floor(container.clientHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform1f(uniforms.u_ratio, w / h);
      updateAvoidBoxes();
    }

    function updatePointer(clientX, clientY) {
      var rect = container.getBoundingClientRect();
      pointer.tx = clientX - rect.left;
      pointer.ty = clientY - rect.top;
    }

    function onPointerMove(e) { updatePointer(e.clientX, e.clientY); }
    function onTouchMove(e) {
      if (e.targetTouches && e.targetTouches[0]) {
        updatePointer(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      }
    }
    function onScroll() {
      scrollProgress = window.pageYOffset / (2 * window.innerHeight);
    }

    window.addEventListener("resize", resize);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("click", onPointerMove);
    if (cycleColor) window.addEventListener("scroll", onScroll, { passive: true });

    resize();
    onScroll();

    var startTS = performance.now();
    var running = true;
    document.addEventListener("visibilitychange", function () {
      var wasHidden = !running;
      running = !document.hidden;
      if (running && wasHidden) requestAnimationFrame(loop);
    });

    function loop(now) {
      if (!running) return;
      requestAnimationFrame(loop);

      pointer.x += (pointer.tx - pointer.x) * 0.2;
      pointer.y += (pointer.ty - pointer.y) * 0.2;

      // Recalcula toda vez pra acompanhar as zonas evitadas mudando (resize,
      // reflow, texto digitado etc.).
      updateAvoidBoxes();
      for (var i = 0; i < MAX_AVOID; i++) {
        var b = avoidBoxes[i];
        gl.uniform4f(uniforms.u_avoid[i], b[0], b[1], b[2], b[3]);
      }

      gl.uniform1f(uniforms.u_time, now - startTS);
      gl.uniform2f(
        uniforms.u_pointer_position,
        pointer.x / container.clientWidth,
        1 - pointer.y / container.clientHeight
      );
      gl.uniform1f(uniforms.u_color_mix, cycleColor ? (0.5 - 0.5 * Math.cos(3 * scrollProgress)) : 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    canvas.style.opacity = String(OPACITY);
    requestAnimationFrame(loop);
  }

  function initNeuralNoise() {
    // Hero: vermelho -> roxo, ciclando pelo scroll (como antes), evitando o título.
    createNeuralNoise({
      container: ".hero",
      canvas: ".hero-noise-canvas",
      colorA: [0.784 * 0.8, 0.118 * 0.8, 0.118 * 0.8], // #C81E1E puxado pro preto
      colorB: [0.420 * 0.8, 0.129 * 0.8, 0.659 * 0.8], // #6B21A8 puxado pro preto
      cycleColor: true,
      avoidSelectors: [".hero-text h1"]
    });

    // Personalize sua marca: verde fixo, evitando o texto/tag e o mockup.
    createNeuralNoise({
      container: ".sec-customize",
      canvas: ".sec-customize .section-noise-canvas",
      colorA: [0.0196 * 0.8, 0.4784 * 0.8, 0.3333 * 0.8], // #057A55 puxado pro preto
      avoidSelectors: [".customize-copy", ".customize-media"]
    });

    // Conheça nossas integrações: roxo fixo, evitando texto/tag, os ícones e a CTA.
    createNeuralNoise({
      container: ".sec-integrations",
      canvas: ".sec-integrations .section-noise-canvas",
      colorA: [0.420 * 0.8, 0.129 * 0.8, 0.659 * 0.8], // #6B21A8 puxado pro preto
      avoidSelectors: [".sec-heading", ".dock-nav", ".inline-cta"]
    });

    // Quem usa, aprova: azul fixo, evitando texto/tag, os cards de depoimento e a CTA.
    createNeuralNoise({
      container: ".sec-quotes",
      canvas: ".sec-quotes .section-noise-canvas",
      colorA: [0.102 * 0.8, 0.337 * 0.8, 0.863 * 0.8], // #1A56DB puxado pro preto
      avoidSelectors: [".sec-heading", ".quotes-grid", ".quotes-cta"]
    });

    // F.A.Q: rosa fixo, evitando as imagens do mosaico, texto/tag, os cards e a CTA.
    createNeuralNoise({
      container: ".sec-faq",
      canvas: ".sec-faq .section-noise-canvas",
      colorA: [0.745 * 0.8, 0.094 * 0.8, 0.365 * 0.8], // #BE185D puxado pro preto
      avoidSelectors: [".faq-shell", ".inline-cta"]
    });
  }

  function init() {
    initMobileReveal();
    initScrollCue();
    initNeuralNoise();

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
