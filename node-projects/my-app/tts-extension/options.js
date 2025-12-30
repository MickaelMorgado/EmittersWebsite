document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('lang');
  const rateSelect = document.getElementById('rate');

  chrome.storage.sync.get(['lang', 'rate'], (result) => {
    langSelect.value = result.lang || 'en';
    rateSelect.value = result.rate || '1.0';
  });

  document.getElementById('save').addEventListener('click', () => {
    const lang = langSelect.value;
    const rate = rateSelect.value;
    chrome.storage.sync.set({ lang, rate }, () => {
      if (chrome.runtime.lastError) {
        alert('Error saving: ' + chrome.runtime.lastError.message);
      } else {
        window.close();
      }
    });
  });
});
