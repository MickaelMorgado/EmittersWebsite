import { NextResponse } from 'next/server';

interface PositionSizingInput {
  accountSize: number; // Total account balance
  riskPercentage: number; // Risk per trade (1-5%, default 2%)
  entryPrice: number; // Entry price
  stopLossPrice: number; // Stop loss price
  pipValue?: number; // Value per pip (for currency pairs, default 10 for standard)
  accountCurrency?: string; // USD, EUR, etc.
}

interface PositionSize {
  positionSize: number;
  lotSize: number; // In standard lots (100k units for forex)
  riskAmount: number; // Dollar amount at risk
  pipDistance: number;
  rewardTarget?: number;
  rrRatio?: number;
}

function calculatePositionSize(input: PositionSizingInput): PositionSize {
  const {
    accountSize,
    riskPercentage,
    entryPrice,
    stopLossPrice,
    pipValue = 10,
    accountCurrency = 'USD',
  } = input;

  // Calculate risk amount in currency
  const riskAmount = accountSize * (riskPercentage / 100);

  // Calculate pip distance (difference between entry and stop loss)
  const pipDistance = Math.abs(entryPrice - stopLossPrice) * 10000; // Convert to pips

  // Calculate position size: Risk Amount / (Pip Distance * Pip Value)
  const positionSize = riskAmount / (pipDistance * (pipValue / 10));

  // Convert to standard lots (1 standard lot = 100,000 units)
  const lotSize = positionSize / 100000;

  // Calculate reward target (typical 1:2 or 1:3 R:R)
  const rewardTarget = entryPrice + ((entryPrice - stopLossPrice) * 2); // 1:2 R:R
  const rrRatio = Math.abs(rewardTarget - entryPrice) / Math.abs(stopLossPrice - entryPrice);

  return {
    positionSize: Math.round(positionSize * 100) / 100,
    lotSize: Math.round(lotSize * 1000) / 1000,
    riskAmount: Math.round(riskAmount * 100) / 100,
    pipDistance: Math.round(pipDistance * 10) / 10,
    rewardTarget: Math.round(rewardTarget * 5) / 5,
    rrRatio: Math.round(rrRatio * 100) / 100,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = calculatePositionSize(body);

    return NextResponse.json({
      success: true,
      ...result,
      input: body,
    });
  } catch (error) {
    console.error('Position sizing error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate position size' },
      { status: 400 }
    );
  }
}

// GET endpoint to get quick sizing for current stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const accountSize = parseFloat(searchParams.get('accountSize') || '10000');
    const riskPercentage = parseFloat(searchParams.get('riskPercentage') || '2');
    const entryPrice = parseFloat(searchParams.get('entryPrice') || '1.1000');
    const stopLossPrice = parseFloat(searchParams.get('stopLossPrice') || '1.0950');

    const result = calculatePositionSize({
      accountSize,
      riskPercentage,
      entryPrice,
      stopLossPrice,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Position sizing error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate position size' },
      { status: 400 }
    );
  }
}
