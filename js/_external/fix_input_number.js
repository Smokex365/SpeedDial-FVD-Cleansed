(function() {
  document.addEventListener("DOMContentLoaded", function() {
    document.body.addEventListener("blur", function(event) {
      var target = event.target;
      if(target.matches("input[type=number][min]")) {
        var min = parseInt(target.getAttribute("min"));
        var val = parseInt(target.value);
        if(val < min) {
          target.value = min;
        }
      }
    }, true);
  }, false)
})();