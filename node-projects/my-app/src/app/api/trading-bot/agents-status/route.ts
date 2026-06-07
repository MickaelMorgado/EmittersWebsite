import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';
import { AgentStatusEnum } from '@/lib/agent-status';

interface AgentStatusResponse {
  ready: boolean;
  approved: boolean;
  status: AgentStatusEnum;
  timestamp: string | null;
}

export async function GET(request: Request) {
  try {
    const basePath = process.env.HOME || '/tmp';

    // Read all agent signal files
    const trendPath = join(basePath, 'development/MikaBot/trend_signal.json');
    const historyPath = join(basePath, 'development/MikaBot/history_recommendation.json');
    const riskPath = join(basePath, 'development/MikaBot/risk_decision.json');

    const getStatusEnum = (ready: boolean, approved: boolean): AgentStatusEnum => {
      if (!ready) return AgentStatusEnum.GRAY;
      if (approved) return AgentStatusEnum.GREEN;
      return AgentStatusEnum.YELLOW;
    };

    console.log('[AGENTS STATUS] Trend ready:', existsSync(trendPath), 'History ready:', existsSync(historyPath), 'Risk ready:', existsSync(riskPath));

    const status: any = {
      trend: { ready: false, approved: false, status: AgentStatusEnum.GRAY, timestamp: null },
      history: { ready: false, approved: false, status: AgentStatusEnum.GRAY, timestamp: null },
      risk: { ready: false, approved: false, status: AgentStatusEnum.GRAY, timestamp: null },
      news: { ready: true, approved: true, status: AgentStatusEnum.GREEN, timestamp: null }, // News always approved
    };

    // Read Trend Signal
    if (existsSync(trendPath)) {
      try {
        const content = readFileSync(trendPath, 'utf-8');
        const data = JSON.parse(content);
        const approved = data.entry_allowed === true;
        status.trend = {
          ready: true,
          approved,
          status: getStatusEnum(true, approved),
          timestamp: data.timestamp,
        };
      } catch (e) {
        console.warn('Failed to read trend_signal.json');
      }
    }

    // Read History Recommendation
    if (existsSync(historyPath)) {
      try {
        const content = readFileSync(historyPath, 'utf-8');
        const data = JSON.parse(content);
        const approved = !!data.rr_ratio; // Has recommendation = approved
        status.history = {
          ready: true,
          approved,
          status: getStatusEnum(true, approved),
          timestamp: data.timestamp,
        };
      } catch (e) {
        console.warn('Failed to read history_recommendation.json');
      }
    }

    // Read Risk Decision
    if (existsSync(riskPath)) {
      try {
        const content = readFileSync(riskPath, 'utf-8');
        const data = JSON.parse(content);
        const approved = data.approved === true;
        status.risk = {
          ready: true,
          approved,
          status: getStatusEnum(true, approved),
          timestamp: data.timestamp,
        };
      } catch (e) {
        console.warn('Failed to read risk_decision.json');
      }
    }

    // Calculate overall readiness
    const allReady = status.trend.ready && status.history.ready && status.risk.ready;
    const allApproved = status.trend.approved && status.history.approved && status.risk.approved && status.news.approved;

    return NextResponse.json({
      status,
      readiness: {
        allReady,
        allApproved,
        canExecute: allReady && allApproved, // GO signal
      }
    });
  } catch (error) {
    console.error('[AGENTS STATUS API] Error:', error);
    return NextResponse.json({
      status: {
        trend: { ready: false, approved: false, timestamp: null },
        history: { ready: false, approved: false, timestamp: null },
        risk: { ready: false, approved: false, timestamp: null },
        news: { ready: false, approved: false, timestamp: null },
      },
      readiness: {
        allReady: false,
        allApproved: false,
        canExecute: false,
      }
    });
  }
}
