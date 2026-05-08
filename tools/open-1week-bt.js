const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening backtest with 1-week data...');
  await page.goto('http://localhost:8080/tools/index6.html?v=28&csv=EURUSD_M5_1week.csv&multipreset=balanced', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  console.log('Clicking Run Backtest...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Run Backtest')
    );
    if (btn) btn.click();
  });

  console.log('Backtest running. Waiting 45s for completion...');
  await page.waitForTimeout(45000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'bt-1week-v28.png', fullPage: false });

  console.log('Browser open for analysis. Press Ctrl+C to close.');
  await new Promise(() => {});
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
