(function () {
  var swatches = document.querySelectorAll(".customize-swatches .swatch");
  var preview = document.getElementById("customizePreview");
  var active = document.getElementById("customizeActive");
  if (!swatches.length || !preview) return;

  swatches.forEach(function (swatch) {
    swatch.addEventListener("click", function () {
      var accent = swatch.getAttribute("data-accent");
      preview.setAttribute("data-accent", accent);
      swatches.forEach(function (s) { s.classList.toggle("is-active", s === swatch); });

      if (active) {
        var sector = swatch.getAttribute("data-sector");
        active.setAttribute("data-accent", accent);
        var label = active.querySelector("strong");
        if (label && sector) label.textContent = sector;
      }
    });
  });
})();
