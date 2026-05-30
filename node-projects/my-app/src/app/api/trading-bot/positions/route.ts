import { NextRequest } from 'next/server';
import fs from 'fs';

const POSITIONS_PATH = '/Users/mickael/development/MikaBot/positions.json';

interface Trade {
  id: string;
  type: string;
  price: number;
  openPrice?: number;
  lot: number;
  time: string;
  profit?: number;
  pnl?: number;
  isOpen?: boolean;
}

function getPositionsData() {
  try {
    let openPositions: Trade[] = [];
    if (fs.existsSync(POSITIONS_PATH)) {
      try {
        const positionsContent = fs.readFileSync(POSITIONS_PATH, 'utf-8');
        const positionsData = JSON.parse(positionsContent);
        openPositions = (positionsData.openPositions || []).map((pos: any, idx: number) => ({
          id: String(pos.ticket || idx),
          type: pos.type,
          price: pos.currentPrice || pos.entryPrice || pos.price || 0,
          openPrice: pos.entryPrice || pos.price || 0,
          lot: 0.01,
          time: pos.openTime || pos.time,
          profit: pos.profit || 0,
          pnl: pos.profit || 0,
          isOpen: true
        }));
      } catch (e) {
        console.log('[positions stream] Warning: Could not parse positions.json');
      }
    }

    return {
      openPositions,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[positions stream] Error reading positions:', error);
    return {
      openPositions: [],
      timestamp: new Date().toISOString(),
      error: 'Failed to read positions'
    };
  }
}

export function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Extract mode from query parameters
  const mode = request.nextUrl.searchParams.get('mode') || 'real';
  console.log(`[positions stream] Client connected - Mode: ${mode}`);

  const stream = new ReadableStream({
    async start(controller) {

      let lastPositionsContent = '';

      const sendUpdate = () => {
        try {
          const data = getPositionsData();
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          console.log('[positions stream] Update sent');
        } catch (error) {
          console.error('[positions stream] Error sending update:', error);
        }
      };

      // Send initial data
      sendUpdate();

      // Check for updates every 50ms for ultra-responsive positions
      const watchInterval = setInterval(() => {
        try {
          if (fs.existsSync(POSITIONS_PATH)) {
            try {
              const positionsContent = fs.readFileSync(POSITIONS_PATH, 'utf-8');
              if (positionsContent !== lastPositionsContent) {
                lastPositionsContent = positionsContent;
                sendUpdate();
              }
            } catch (e) {
              // File might be locked, skip this check
            }
          }
        } catch (error) {
          console.error('[positions stream] Error checking files:', error);
        }
      }, 50); // Ultra-fast 50ms for positions (200 updates/second)

      request.signal.addEventListener('abort', () => {
        clearInterval(watchInterval);
        controller.close();
        console.log('[positions stream] Client disconnected');
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
