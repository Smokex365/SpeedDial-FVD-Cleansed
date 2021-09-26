(function() {
  window.UniClick = {
    add: function(element, listener) {
      var down = false;
      element.addEventListener("click", function(event) {
        if(event.button === 0) {
          listener(event);
        }
      });
      // use mousedown/mouseup to handle middle button clicks
      element.addEventListener("mousedown", function(event) {
        if(event.button !== 1) {
          return;
        }
        down = true;
      });
      element.addEventListener("mouseout", function(event) {
        if(down) {
          down = false;
        }
      });
      element.addEventListener("mouseup", function(event) {
        if(event.button !== 1) {
          return;
        }
        if(down) {
          // fake event
          listener({
            button: 1,
            stopPropagation: event.stopPropagation.bind(event)
          });
        }
      });
    }
  };
})();