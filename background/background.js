chrome.runtime.onInstalled.addListener(() => {
  console.log('[Video Player] 扩展已安装');

  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          autoPlay: true,
          saveRecord: true,
          loopPlay: false,
          defaultSpeed: 1
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-settings') {
    chrome.storage.local.get(['settings'], (result) => {
      sendResponse(result.settings || {});
    });
    return true;
  }
});
