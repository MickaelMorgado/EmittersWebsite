chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakSelection",
    title: "Speak selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakSelection") {
    chrome.tabs.sendMessage(tab.id, { type: 'SPEAK', text: info.selectionText });
  }
});
