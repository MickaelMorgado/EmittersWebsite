import { NextRequest } from 'next/server';
import fs from 'fs';

const PRICES_FILE = '/Users/mickael/development/MikaBot/prices.json';

export function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      console.log('[trading-bot prices] Client connected');

      let lastPricesMtime = 0;

      const sendUpdate = () => {
        try {
          if (fs.existsSync(PRICES_FILE)) {
            const pricesContent = fs.readFileSync(PRICES_FILE, 'utf-8');
            const pricesData = JSON.parse(pricesContent);
            const message = `data: ${JSON.stringify(pricesData)}\n\n`;
            controller.enqueue(encoder.encode(message));
            console.log('[trading-bot prices] Update sent');
          }
        } catch (error) {
          console.error('[trading-bot prices] Error sending update:', error);
        }
      };

      // Check for price updates every 100ms (10Hz) for responsive UI
      const priceInterval = setInterval(() => {
        try {
          if (fs.existsSync(PRICES_FILE)) {
            const pricesMtime = fs.statSync(PRICES_FILE).mtime.getTime();
            if (pricesMtime > lastPricesMtime) {
              lastPricesMtime = pricesMtime;
              sendUpdate();
            }
          }
        } catch (error) {
          console.error('[trading-bot prices] Error checking files:', error);
        }
      }, 100);

      // Send initial data
      sendUpdate();

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(priceInterval);
        controller.close();
        console.log('[trading-bot prices] Client disconnected');
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
