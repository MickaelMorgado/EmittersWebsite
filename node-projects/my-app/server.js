const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from .next/static
app.use('/_next/static', express.static(path.join(__dirname, '.next', 'static')));

// Serve public files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/signal', (req, res) => {
  res.json({ status: 'ok', signal: 'NEUTRAL' });
});

app.post('/api/trades', (req, res) => {
  res.json({ status: 'logged' });
});

// Catch-all for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MikaBot - Trading Bot Interface</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; max-width: 900px; margin: 50px auto; padding: 20px; }
            h1 { color: #0066cc; }
            .feature { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>🤖 MikaBot Trading Bot Interface</h1>
          <p><strong>Branch:</strong> feat/multi-position-strategy</p>
          
          <h2>Active Features:</h2>
          <div class="feature">✅ Multi-position strategy trading</div>
          <div class="feature">✅ Entry zone signal detection</div>
          <div class="feature">✅ Fast backtest mode</div>
          <div class="feature">✅ Trailing stop management</div>
          <div class="feature">✅ Grid search optimization</div>
          <div class="feature">✅ Real-time chart analysis</div>
          
          <h2>Connections:</h2>
          <p><strong>Signal Server:</strong> <a href="http://127.0.0.1:9091/health">http://127.0.0.1:9091</a></p>
          <p><strong>Status:</strong> Ready for trading signals</p>
          
          <hr>
          <p><em>EmittersWebsite/node-projects/my-app - feat/multi-position-strategy branch</em></p>
        </body>
      </html>
    `);
  }
});

const server = http.createServer(app);
server.listen(PORT, '127.0.0.1', () => {
  console.log('✅ MikaBot Trading Interface');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔗 Branch: feat/multi-position-strategy`);
  console.log(`📊 Running from: ~/development/EmittersWebsite`);
});
