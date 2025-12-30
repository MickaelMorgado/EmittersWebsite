chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SPEAK') {
    const options = message.options || {};
    if (typeof window.browserSpeak === 'function') {
      window.browserSpeak(message.text, { language: "fr", voiceName: "Google" });
    } else if (window.browserSpeak && typeof window.browserSpeak.speak === 'function') {
      window.browserSpeak.speak(message.text, { language: "fr", voiceName: "Google" });
    }
  }
});
