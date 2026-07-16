/* Seletor de cor da Section 4 — recolore os formulários de preview ao lado.
   Cada cor define --cx (cor forte) e --cx-tint (fundo suave) no container. */
(function () {
  var picker = document.getElementById("customizePreview");
  var swatches = document.querySelectorAll(".cz-swatches .cz-swatch");
  if (!picker || !swatches.length) return;

  var TINTS = {
    blue: "#EBF1FE",
    purple: "#F3E8FF",
    red: "#FDECEC",
    pink: "#FDEEF5",
    green: "#E9F7F0",
    orange: "#FFF3EA",
    gold: "#FFF8E6",
    dark: "#EDEFF3"
  };

  function apply(accent) {
    picker.setAttribute("data-accent", accent);
    picker.style.setProperty("--cx", "var(--" + accent + ")");
    picker.style.setProperty("--cx-tint", TINTS[accent] || "#EBF1FE");
  }

  swatches.forEach(function (swatch) {
    swatch.addEventListener("click", function () {
      var accent = swatch.getAttribute("data-accent");
      if (!accent) return;
      apply(accent);
      swatches.forEach(function (s) { s.classList.toggle("is-active", s === swatch); });
    });
  });
})();
