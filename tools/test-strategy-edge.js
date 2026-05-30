const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== Opening Backtest with v28 ===');
  await page.goto('http://localhost:8080/tools/index6.html?v=28&csv=EURUSD_M5_202603020000_202603170000.csv&multipreset=balanced', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.waitForTimeout(3000);

  // Check current config
  const config = await page.evaluate(() => {
    return {
      strategy: document.getElementById('strategyInput')?.value,
      sl: document.getElementById('SLPoints').value,
      tp: document.getElementById('TPPoints').value,
      multiPos: getMultiPositionConfig()
    };
  });
  
  console.log('Current config:', JSON.stringify(config, null, 2));

  // Run backtest
  console.log('\nRunning backtest...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('Run Backtest')
    );
    if (btn) btn.click();
  });

  // Wait for backtest to complete (check for result panel)
  await page.waitForFunction(
    () => {
      const panel = document.getElementById('result-panel');
      return panel && panel.classList.contains('active');
    },
    { timeout: 120000 }
  );

  await page.waitForTimeout(2000);

  // Get results
  const results = await page.evaluate(() => {
    const profitEl = document.getElementById('totalProfit');
    const winRateEl = document.getElementById('winRate');
    const totalTradesEl = document.getElementById('totalTrades');
    const profitFactorEl = document.getElementById('profitFactor');
    
    return {
      totalProfit: profitEl?.textContent || 'N/A',
      winRate: winRateEl?.textContent || 'N/A',
      totalTrades: totalTradesEl?.textContent || 'N/A',
      profitFactor: profitFactorEl?.textContent || 'N/A',
      orders: window.ordersHistory?.length || 0,
      closedOrders: window.ordersHistory?.filter(o => o.closed).length || 0
    };
  });

  console.log('\n=== BACKTEST RESULTS ===');
  console.log('Total Profit:', results.totalProfit);
  console.log('Win Rate:', results.winRate);
  console.log('Total Trades:', results.totalTrades);
  console.log('Profit Factor:', results.profitFactor);
  console.log('Orders:', results.orders, '(Closed:', results.closedOrders, ')');

  // Take screenshot
  await page.screenshot({ path: 'strategy-results-v28.png', fullPage: false });
  console.log('\nScreenshot saved to strategy-results-v28.png');

  console.log('\nBrowser staying open for analysis. Press Ctrl+C to close.');
  
  // Keep alive
  await new Promise(() => {});
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
