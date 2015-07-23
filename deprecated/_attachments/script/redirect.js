window.onload=function() {
  window.setTimeout(function () {
    window.location.href =
      document.getElementById("redirect").getAttribute("href");
  }, 3000);
}
