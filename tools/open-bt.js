const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  console.log('Opening backtest interface...');
  await page.goto('http://localhost:8080/tools/index6.html?v=28&csv=EURUSD_M5_202603020000_202603170000.csv&multipreset=balanced', {
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

  console.log('Backtest running. Waiting for results...');
  await page.waitForTimeout(60000);

  console.log('Taking screenshot of equity curve...');
  await page.screenshot({ path: 'equity-analysis.png', fullPage: false });

  console.log('Browser staying open. Analyze the chart and equity curve.');
  console.log('Suggestions to improve edge:');
  console.log('1. Increase SL to 0.0005 (50 pips) - give trades more room');
  console.log('2. Increase TP to 0.0010 (100 pips) - higher R:R ratio');
  console.log('3. Add trend filter - only take trades in MA direction');
  console.log('4. Tighten entry - require stronger CSID breakout');
  console.log('5. Reduce position C lot size (risk less on furthest target)');
  console.log('\nPress Ctrl+C to close browser.');

  await new Promise(() => {});
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
