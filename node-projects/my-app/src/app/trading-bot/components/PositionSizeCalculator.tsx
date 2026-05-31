"use client";

import { useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';

interface PositionSizeResult {
  positionSize: number;
  lotSize: number;
  riskAmount: number;
  pipDistance: number;
  rewardTarget?: number;
  rrRatio?: number;
}

interface PositionSizeCalculatorProps {
  accountSize?: number;
  onCalculate?: (result: PositionSizeResult) => void;
}

export default function PositionSizeCalculator({
  accountSize = 10000,
  onCalculate,
}: PositionSizeCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [riskPercentage, setRiskPercentage] = useState(2);
  const [entryPrice, setEntryPrice] = useState(1.1000);
  const [stopLossPrice, setStopLossPrice] = useState(1.0950);
  const [result, setResult] = useState<PositionSizeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trading-bot/position-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSize,
          riskPercentage,
          entryPrice,
          stopLossPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        onCalculate?.(data);
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  }, [accountSize, riskPercentage, entryPrice, stopLossPrice, onCalculate]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !result) {
            calculate();
          }
        }}
        className="flex items-center gap-1 px-2 py-1 text-[8px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-colors"
        title="Position Size Calculator"
      >
        <Calculator className="w-3 h-3 text-cyan-400" />
        <span className="text-cyan-400">CALC</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#0f172a] border border-cyan-500/30 rounded-lg p-3 z-50 shadow-xl">
          <div className="space-y-2.5 text-[9px]">
            {/* Account Size (Read-only) */}
            <div>
              <label className="text-white/50 block mb-0.5">Account Size</label>
              <div className="text-xs font-mono text-cyan-400">
                ${accountSize.toLocaleString()}
              </div>
            </div>

            {/* Risk Percentage */}
            <div>
              <label className="text-white/50 block mb-0.5">
                Risk Per Trade: {riskPercentage}%
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-[8px] text-white/30 flex justify-between mt-0.5">
                <span>0.5%</span>
                <span>5%</span>
              </div>
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-white/50 block mb-0.5">Entry Price</label>
              <input
                type="number"
                step="0.0001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value))}
                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs font-mono text-right"
              />
            </div>

            {/* Stop Loss Price */}
            <div>
              <label className="text-white/50 block mb-0.5">Stop Loss Price</label>
              <input
                type="number"
                step="0.0001"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(parseFloat(e.target.value))}
                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs font-mono text-right"
              />
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculate}
              disabled={loading}
              className="w-full mt-3 px-2 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-bold rounded transition-colors disabled:opacity-50 text-[9px]"
            >
              {loading ? 'Calculating...' : 'Calculate'}
            </button>

            {/* Results */}
            {result && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                <div className="bg-white/[0.03] p-1.5 rounded border border-white/[0.05]">
                  <div className="text-white/50 mb-0.5">Position Size</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {result.positionSize.toFixed(2)} units
                  </div>
                  <div className="text-[8px] text-white/40">
                    {result.lotSize.toFixed(3)} lots
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-white/[0.03] p-1.5 rounded border border-white/[0.05]">
                    <div className="text-white/50 text-[8px] mb-0.5">Risk Amount</div>
                    <div className="text-xs font-bold text-red-400">
                      ${result.riskAmount.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-white/[0.03] p-1.5 rounded border border-white/[0.05]">
                    <div className="text-white/50 text-[8px] mb-0.5">Pips</div>
                    <div className="text-xs font-bold text-white/70">
                      {result.pipDistance.toFixed(0)}
                    </div>
                  </div>
                </div>

                {result.rewardTarget && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-white/[0.03] p-1.5 rounded border border-white/[0.05]">
                      <div className="text-white/50 text-[8px] mb-0.5">Take Profit</div>
                      <div className="text-xs font-bold text-emerald-400">
                        {result.rewardTarget.toFixed(4)}
                      </div>
                    </div>

                    <div className="bg-white/[0.03] p-1.5 rounded border border-white/[0.05]">
                      <div className="text-white/50 text-[8px] mb-0.5">R:R Ratio</div>
                      <div className="text-xs font-bold text-cyan-400">
                        1:{result.rrRatio?.toFixed(1)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[8px] text-white/40 pt-1">
                  Entry: {entryPrice.toFixed(4)} | SL: {stopLossPrice.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
