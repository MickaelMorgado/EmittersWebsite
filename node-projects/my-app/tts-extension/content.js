chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SPEAK') {
    if (typeof window.browserSpeak === 'function') {
      window.browserSpeak(message.text);
    } else if (window.browserSpeak && typeof window.browserSpeak.speak === 'function') {
      window.browserSpeak.speak(message.text);
    }
  }
});
