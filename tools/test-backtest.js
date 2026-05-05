const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== CHART-BASED BACKTEST ===');
  await page.setViewportSize({ width: 1400, height: 900 });

  // Load with CSV
  await page.goto('http://localhost:8080/tools/index6.html?csv=EURUSD_M5_202603020000_202603170000.csv&multipreset=balanced', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Uncheck fast mode
  await page.evaluate(() => {
    const checkbox = document.getElementById('fastBacktestMode');
    if (checkbox && checkbox.checked) checkbox.checked = false;
  });

  // Click Run Backtest
  console.log('Running backtest...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Run Backtest'));
    if (btn) btn.click();
  });

  // Wait more time
  console.log('Waiting for backtest...');
  await page.waitForTimeout(90000);

  // Get results
  const results = await page.evaluate(() => {
    const resultEl = document.getElementById('backtestingResult');
    const orders = window.ordersHistory || [];
    return {
      resultText: resultEl?.value || '',
      ordersCount: orders.length,
      orders: orders
    };
  });

  console.log('\n=== RESULTS ===');
  console.log('Orders:', results.ordersCount);
  console.log('\nBacktesting Result:');
  console.log(results.resultText.substring(0, 800));

  // Summary stats
  const wins = results.orders.filter(o => o.tradeResult === 'WIN').length;
  const losses = results.orders.filter(o => o.tradeResult === 'LOSS').length;
  const bes = results.orders.filter(o => o.tradeResult === 'BE').length;
  console.log(`\nWins: ${wins}, Losses: ${losses}, BE: ${bes}`);
  console.log(`Win Rate: ${results.ordersCount > 0 ? ((wins/results.ordersCount)*100).toFixed(1) : 0}%`);

  // Screenshot
  await page.screenshot({ path: 'backtest-result.png', fullPage: true });
  console.log('\nScreenshot saved!');

  console.log('\nPress Enter to close...');
  process.stdin.once('data', () => browser.close());
})();