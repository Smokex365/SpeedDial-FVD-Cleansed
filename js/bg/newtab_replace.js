(function() {
  /* // DISABLE NEWTAB REPLACE FOR OPERA, Task #2153s
  var newtabUrls = ['opera://startpage/', 'browser://startpage/', 'chrome://startpage/'];
  var addonUrl = chrome.runtime.getURL("newtab.html");

  chrome.tabs.onCreated.addListener(function(tab){
    if(newtabUrls.indexOf(tab.url) === -1) {
      return;
    }
    chrome.tabs.update(tab.id, {
      url: addonUrl
    });
  });
  */

  // replace current new tabs by FVD Speed Dial
  /* // Task #1991
  newtabUrls.forEach(function(url) {
    chrome.tabs.query({
       url: url
    }, function(tabs) {
      if(!tabs || !tabs.length) {
        return;
      }
      tabs.forEach(function(tab) {
        chrome.tabs.update(tab.id, {
          url: addonUrl
        });
      });
    });
  });
  */
})();