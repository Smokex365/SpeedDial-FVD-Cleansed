# Notice
There will probably not be any updates for this. With Chrome's move to Manifest v3 (and subsequently disabling adblocking and many other extensions) I am no longer using Chrome. I may look into moving it over to Firefox but that is quite the undertaking. At least for now it works on Chrome and the injected ads are fairly well taken care of.

# SpeedDial-FVD-Cleansed
This is a "forked" version of the [Speed Dial [FVD] - New Tab Page](https://chrome.google.com/webstore/detail/speed-dial-fvd-new-tab-pa/llaficoajjainaijghjlofdfmbjpebpa?hl=en). Since the developer, nimbus had decided to start doing ad redirects I've decided to remove them. If they get their act together or Google removes/forces them to stop then I'll remove this.

Currently based on version 81.8.1.

Current Modifications:

* Removed Ad redirects
* Changed default search to Google for now
* Started on adding on-dial search for more sites

## To-do

* Remove data collection
* Improve general transparency of the extension
* Remove Russian connections - Yandex, several Russian sites
  * where it feels necessary (search like Yandex can stay but everything else will likely be removed)
* Add new search providers - [search.js]([js/newtab/search.js#L16)
  * [x] DuckDuckGo
  * [x] Youtube
  * [x] Reddit
* Fix search selection menu
![search-selection-menu](https://github.com/Smokex365/SpeedDial-FVD-Cleansed/assets/5600410/ce808010-d98f-4e85-8bcf-9a785113f168)
  * [x] Providers set up (google, reddit, youtube, duckduckgo)
  * [ ] menu works...kind of
    * menu can be selected once on load and will switch to selected provider
    * after selection you can't access the menu without a reload
  * [ ] find a way to set the menu to the search logo (or alternately add it to the right-click menu)
  * [ ] create hover or onClick to change provider
* [ ]  Add ability to export settings to file and re-import from file instead of text string
* [x]  Add some instructions for loading the extension for general users.

### Instructions

How to load SpeedDial-FVD-Cleansed into Chrome

1. Download or `git clone` to your local computer.
2. In Chrome open the extension management page and enable developer mode if not already enabled.
3. Select Load Unpacked

   ![load-unpacked-ext](https://github.com/Smokex365/SpeedDial-FVD-Cleansed/assets/5600410/0c9a8593-87e4-4184-be7f-36a8752fc8c6)
4. Select where you saved the extension folder and select the root.

   ![select-ext-dir](https://github.com/Smokex365/SpeedDial-FVD-Cleansed/assets/5600410/2253ddf3-cc21-456f-afe7-4f34980cb283)

5. Confirm and let Chrome load the extension. You may have to toggle it to enable or open a new tab to get it to load.
