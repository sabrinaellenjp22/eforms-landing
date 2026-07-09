(function () {
  var swatches = document.querySelectorAll(".customize-swatches .swatch");
  var preview = document.getElementById("customizePreview");
  if (!swatches.length || !preview) return;

  swatches.forEach(function (swatch) {
    swatch.addEventListener("click", function () {
      var accent = swatch.getAttribute("data-accent");
      preview.setAttribute("data-accent", accent);
      swatches.forEach(function (s) { s.classList.toggle("is-active", s === swatch); });
    });
  });
})();
