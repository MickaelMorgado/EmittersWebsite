chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakSelection",
    title: "Speak selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.storage.sync.get(['lang', 'rate'], (result) => {
    const options = {
      lang: result.lang || 'en',
      rate: parseFloat(result.rate) || 1.0
    };
    chrome.tabs.sendMessage(tab.id, { type: 'SPEAK', text: info.selectionText, options });
  });
});
