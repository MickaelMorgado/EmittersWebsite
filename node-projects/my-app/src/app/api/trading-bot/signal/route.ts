import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RiskDecision {
  approved: boolean;
  position_size: number;
  stop_loss_pips: number;
  take_profit_pips: number;
  rejection_reason?: string;
}

/**
 * POST /api/trading-bot/signal
 *
 * Master Agent calls this with a trade signal.
 * This endpoint:
 * 1. Calls Risk Agent for approval
 * 2. If approved: writes to signal.txt for EA
 * 3. If rejected: returns rejection reason
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      signal,
      timestamp,
      debug = false,
      confidence = 0,
      rr_ratio = '1:3',
      history_sl_pips = 50,
    } = body;

    // Validate signal
    if (!['BUY', 'SELL', 'NEUTRAL'].includes(signal)) {
      return NextResponse.json(
        { error: 'Invalid signal. Must be BUY, SELL, or NEUTRAL' },
        { status: 400 }
      );
    }

    // NEUTRAL signals don't require Risk approval - no trade
    if (signal === 'NEUTRAL') {
      return NextResponse.json(
        {
          success: true,
          signal: 'NEUTRAL',
          message: 'No trade action for NEUTRAL signal'
        },
        { status: 200 }
      );
    }

    // For BUY/SELL: Request Risk Agent approval
    console.log(
      `[SIGNAL] Requesting Risk Agent approval for ${signal} (confidence: ${confidence}%)`
    );

    let riskDecision: RiskDecision = {
      approved: false,
      position_size: 0,
      stop_loss_pips: history_sl_pips,
      take_profit_pips: history_sl_pips * 3,
    };

    try {
      // Call Risk Agent endpoint
      const riskResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/trading-bot/agents/risk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signal,
            confidence,
            symbol: 'BTCUSD',
            rr_ratio,
            history_sl_pips,
          }),
        }
      );

      const riskData = await riskResponse.json();

      if (riskResponse.ok) {
        riskDecision = {
          approved: riskData.approved,
          position_size: riskData.position_size,
          stop_loss_pips: riskData.stop_loss_pips,
          take_profit_pips: riskData.take_profit_pips,
          rejection_reason: riskData.rejection_reason,
        };
      } else {
        console.error('[SIGNAL] Risk Agent error:', riskData.error);
        return NextResponse.json(
          { error: 'Risk Agent unavailable: ' + riskData.error },
          { status: 503 }
        );
      }
    } catch (err) {
      console.error('[SIGNAL] Failed to call Risk Agent:', err);
      return NextResponse.json(
        { error: 'Could not reach Risk Agent: ' + String(err) },
        { status: 503 }
      );
    }

    // Check if Risk Agent approved the trade
    if (!riskDecision.approved) {
      console.log(
        `[SIGNAL] ✗ Trade rejected by Risk Agent: ${riskDecision.rejection_reason}`
      );

      return NextResponse.json(
        {
          success: false,
          signal,
          approved: false,
          rejection_reason: riskDecision.rejection_reason,
          message: `Trade rejected: ${riskDecision.rejection_reason}`,
        },
        { status: 403 }
      );
    }

    // Risk Agent approved - write signal to EA
    console.log(
      `[SIGNAL] ✓ Trade approved by Risk Agent | Size: ${riskDecision.position_size} | SL: ${riskDecision.stop_loss_pips}p TP: ${riskDecision.take_profit_pips}p`
    );

    const signalFile = join(process.env.HOME || '/tmp', 'development/MikaBot/signal.txt');

    // Create signal content for EA (minified)
    const signalContent = JSON.stringify({
      signal,
      timestamp: timestamp || new Date().toISOString(),
      debug,
      generated_at: new Date().toISOString(),
      trading: {
        stopLossPips: riskDecision.stop_loss_pips,
        takeProfitPips: riskDecision.take_profit_pips,
        positionSize: riskDecision.position_size,
      },
      confidence,
    });

    // Write signal file - EA will read and execute
    writeFileSync(signalFile, signalContent, 'utf-8');

    console.log(
      `[${debug ? 'DEBUG' : 'REAL'}] ${signal} | SL:${riskDecision.stop_loss_pips}p TP:${riskDecision.take_profit_pips}p Size:${riskDecision.position_size} | Confidence:${confidence}%`
    );

    return NextResponse.json(
      {
        success: true,
        signal,
        approved: true,
        trading: {
          stopLossPips: riskDecision.stop_loss_pips,
          takeProfitPips: riskDecision.take_profit_pips,
          positionSize: riskDecision.position_size,
        },
        confidence,
        file: signalFile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SIGNAL] Endpoint error:', error);
    return NextResponse.json(
      { error: `Server error: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Read current signal from file
    const signalFile = join(process.env.HOME || '/tmp', 'development/MikaBot/signal.txt');

    try {
      const { readFileSync } = await import('fs');
      const content = readFileSync(signalFile, 'utf-8');
      const signalData = JSON.parse(content);
      return NextResponse.json(signalData, { status: 200 });
    } catch {
      return NextResponse.json(
        { message: 'No signal file found yet' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Get signal error:', error);
    return NextResponse.json(
      { error: 'Failed to read signal' },
      { status: 500 }
    );
  }
}
