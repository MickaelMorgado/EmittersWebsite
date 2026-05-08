const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening backtest with v29 (bug fix)...');
  await page.goto('http://localhost:8080/tools/index6.html?v=29&csv=EURUSD_M5_1week.csv&multipreset=balanced', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  console.log('Running backtest...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Run Backtest')
    );
    if (btn) btn.click();
  });

  console.log('Waiting 50s for backtest completion...');
  await page.waitForTimeout(50000);

  console.log('Screenshot saved to bt-v29-analysis.png');
  await page.screenshot({ path: 'bt-v29-analysis.png', fullPage: false });

  console.log('\nBrowser open. Analyze the equity curve and trades.');
  console.log('\nStrategy edge suggestions (parametric & trade management):');
  console.log('');
  console.log('TRADE MANAGEMENT:');
  console.log('1. Monthly max loss limit - stop trading if monthly loss > X%');
  console.log('2. Consecutive loss limit - stop after 3-4 consecutive losses');
  console.log('3. Time-based exit - close all positions at session end (22:00)');
  console.log('4. Break-even per position - A moves to BE at 1R, B at 1.5R, C at 2R');
  console.log('');
  console.log('PARAMETRIC OPTIMIZATION:');
  console.log('5. Test slMoveStartR: A=0.3|0.5|0.7, B=0.8|1.0|1.2, C=1.2|1.5|2.0');
  console.log('6. Test trailingStartR: A=1.5|2.0|2.5, B=2.5|3.0|3.5, C=3.5|4.0|5.0');
  console.log('7. Test lot distribution: aggressive(1.5,0.7,0.3), conservative(0.5,0.5,0.5)');
  console.log('8. Test SL/TP: 0.0003/0.0006 (1:2), 0.0005/0.0010 (1:2), 0.0003/0.0009 (1:3)');

  console.log('\nPress Ctrl+C to close browser.');
  await new Promise(() => {});
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
