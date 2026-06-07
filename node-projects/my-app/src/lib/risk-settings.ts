import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface RiskSettings {
  daily_drawdown_pct: number;
  weekly_drawdown_pct: number;
  monthly_drawdown_pct: number;
}

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  daily_drawdown_pct: 5,
  weekly_drawdown_pct: 7.5,
  monthly_drawdown_pct: 10,
};

function settingsPath(): string {
  return join(process.env.HOME || '/tmp', 'development/MikaBot/risk_settings.json');
}

export function readRiskSettings(): RiskSettings {
  try {
    const p = settingsPath();
    if (!existsSync(p)) return DEFAULT_RISK_SETTINGS;
    const raw = JSON.parse(readFileSync(p, 'utf-8'));
    return {
      daily_drawdown_pct:   typeof raw.daily_drawdown_pct   === 'number' ? raw.daily_drawdown_pct   : DEFAULT_RISK_SETTINGS.daily_drawdown_pct,
      weekly_drawdown_pct:  typeof raw.weekly_drawdown_pct  === 'number' ? raw.weekly_drawdown_pct  : DEFAULT_RISK_SETTINGS.weekly_drawdown_pct,
      monthly_drawdown_pct: typeof raw.monthly_drawdown_pct === 'number' ? raw.monthly_drawdown_pct : DEFAULT_RISK_SETTINGS.monthly_drawdown_pct,
    };
  } catch (e) {
    console.warn('[RISK SETTINGS] Failed to read, using defaults:', e);
    return DEFAULT_RISK_SETTINGS;
  }
}

export function writeRiskSettings(next: RiskSettings): void {
  writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf-8');
}
