/**
 * speakBrowser - Speaks the given text using the Web Speech API.
 * 
 * Usage:
 * 1. As a standalone script via CDN or script tag:
 *    <script src="path/to/speakBrowser.js"></script>
 *    <script>
 *      speakBrowser('Hello world');
 *    </script>
 */

const speakBrowser = (text) => {
  if (typeof window === "undefined" || !('speechSynthesis' in window)) {
    console.warn("Speech Synthesis API not supported in this environment.");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
};

// Expose speakBrowser globally
window.speakBrowser = speakBrowser;
