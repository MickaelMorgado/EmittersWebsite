const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== CHECK PRESET CONFIG ===');
  await page.goto('http://localhost:8080/tools/index6.html?v=26&csv=EURUSD_M5_202603020000_202603170000.csv&multipreset=balanced', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const config = await page.evaluate(() => {
    const preset = getMultiPositionConfig();
    const slInput = document.getElementById('SLPoints').value;
    const tpInput = document.getElementById('TPPoints').value;
    return {
      enabled: preset.enabled,
      positions: preset.positions,
      slSize: slInput,
      tpSize: tpInput
    };
  });

  console.log('Preset:', JSON.stringify(config, null, 2));

  console.log('\nRunning backtest...');
  await page.evaluate(() => {
    const checkbox = document.getElementById('fastBacktestMode');
    if (checkbox && checkbox.checked) checkbox.checked = false;
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Run Backtest'));
    if (btn) btn.click();
  });

  await page.waitForTimeout(90000);

  const orders = await page.evaluate(() => window.ordersHistory || []);

  console.log('\n=== TRADE 1 (First signal) ===');
  orders.slice(0, 3).forEach(o => {
    console.log(`${o.id}: Entry=${o.price} SL=${o.sl} initialSL=${o.initialSL} slMoveStartR=${o.slMoveStartR} trailingStartR=${o.trailingStartR}`);
  });
  
  // Check that SL hasn't moved on entry candle
  const firstOrder = orders[0];
  if (firstOrder && firstOrder.sl === firstOrder.initialSL) {
    console.log('\n✅ SUCCESS: SL did not move on entry candle');
  } else {
    console.log('\n❌ FAIL: SL moved on entry candle');
  }

  console.log('\nTaking screenshot...');
  await page.screenshot({ path: 'backtest-result-v26.png', fullPage: false });
  console.log('Screenshot saved to backtest-result-v26.png');

  await browser.close();
})();