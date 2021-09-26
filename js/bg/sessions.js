(function() { // Task #1189
    localStorage.setItem("just-opened", 1);
    
    chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){        
        if(typeof message == "object") {
            if(message.action == "previousSession:get") {
                getPreviousSession(message.sessionId, false);
                
            }else
            if(message.action == "previousSession:restore") {
                getPreviousSession(message.sessionId, true);
                
            }
        }
    });
    
    function getPreviousSession(sessionId, restore){
        if(!restore){
            chrome.storage.local.get("last", function(result){
                if(result && result.last && result.last.length){
                    chrome.runtime.sendMessage({
                        "action"  : "previousSession:button",
                        "nTabs"    : result.last.length,
                        "sessionId": 999,
                    });
                    
                    console.info('previousSession:button', result.last.length);
                }
            });
        }else{
            chrome.storage.local.get("target", function(result){
                if(result && result.target == "window"){
                    chrome.tabs.getAllInWindow(function(tabsCheck){
                        var inNewWindow = false;

                        for(var k in tabsCheck){
                            var url = String(tabsCheck[k].url);

                            if(
                                (url.indexOf("about:") == -1) &&
                                (url.indexOf("chrome://") == -1) &&
                                (url.indexOf("chrome-extension://") == -1) &&
                                (url.indexOf("moz-extension://") == -1)
                            ){
                                inNewWindow = true;
                                break;
                            }
                        }

                        if(inNewWindow){
                            chrome.windows.create(function(window){
                                restoreSessionInWindow(window.id);
                            });
                        }else{
                            chrome.windows.getCurrent(function(window){
                               restoreSessionInWindow(window.id);
                           });         
                        }
                    });
                }else{
                   chrome.windows.getCurrent(function(window){
                       restoreSessionInWindow(window.id);
                   });
                }
            });
        }
    }
    
    function restoreSessionInWindow(windowId){
        chrome.tabs.getAllInWindow(windowId, function(tabsForRemove){
            chrome.storage.local.get("last", function(result){
                if(result && result.last && result.last.length){
                    for(let Tab of result.last){
                        chrome.tabs.create({
                            windowId:windowId,
                            url     : Tab.url,
                            active  : Tab.selected,
                            pinned  : Tab.pinned,
                        });
                    }//for

                    //Remove old tabs
                    var rmTabArr = [];
                    for(let rmTab of tabsForRemove) rmTabArr.push(rmTab.id);
                    chrome.tabs.remove(rmTabArr);
                }//if
            });  
        }); 
    }

    var EventN = 0, WriteStop = true, removedWindows = [];

    chrome.storage.local.get("current", function (result) {
        if (result['current']){
            var Last, upd=0;
            
            for(var key in result['current']){
                if(result['current'][key].updated > upd){
                    Last = result['current'][key].tabsList;
                    upd  = result['current'][key].updated;
                }
            }
            
            if(Last){
                chrome.storage.local.set({
                    last    : Last,
                    target  : "self"
                });
            }
        }
        
        WriteStop = false;
    });

    chrome.windows.onRemoved.addListener(function (windowId) {
        removedWindows.push(windowId);
        
        chrome.storage.local.get("current", function (result) {
            if (result['current']) for(var key in result['current']){
                if(result['current'][key]['windowId'] == windowId){
                    
                    chrome.storage.local.set({
                        last   : result['current'][key].tabsList,
                        target : "window"
                    });
                    
                    localStorage.setItem("just-opened", 1);
                    localStorage.setItem("page-show-loading", 1);
                    
                    chrome.runtime.sendMessage({
                        "action"  : "previousSession:get"
                    });
                    
                    break;
                }
            }
        });
    });
    
    function chromeTabsChange(reason) {
        if (!WriteStop) WriteStop = true;
        else return false;

        setTimeout(function () {
            WriteStop = false;

            chrome.tabs.query({currentWindow: true}, function (Tabs) {
                if (Tabs.length && Tabs[0].id != -1) {
                    var tabsList = [], windowId=false;

                    console.info("Tabs: "+Tabs.length, Tabs[0].id);

                    for (let Tab of Tabs)
                        if (removedWindows.indexOf(Tab.windowId) == -1) {
                            
                            windowId = Tab.windowId;
                            
                            tabsList.push({
                                id: Tab.id,
                                url: Tab.url,
                                index: Tab.index,
                                pinned: Tab.pinned,
                                selected: Tab.selected,
                            });
                        }

                    if (tabsList.length) {
                        chrome.storage.local.get(["current", "last"], function (result) {
                            var current = result.current || {};
                            
                            current[windowId] = {
                                windowId: windowId,
                                updated : Date.now(),
                                tabsList: tabsList
                            }//if
                            
                            chrome.storage.local.set({
                                current: current
                            });
                        });
                    }
                }
            });
        }, 1000);
    }
    
    chrome.tabs.onActivated.addListener(chromeTabsChange);
    chrome.tabs.onReplaced.addListener(chromeTabsChange);
    chrome.tabs.onAttached.addListener(chromeTabsChange);
    chrome.tabs.onDetached.addListener(chromeTabsChange);
    //chrome.tabs.onUpdated.addListener(chromeTabsChange);
    chrome.tabs.onCreated.addListener(chromeTabsChange);
    chrome.tabs.onMoved.addListener(chromeTabsChange);
})();