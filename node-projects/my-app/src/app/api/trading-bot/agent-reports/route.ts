import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REPORTS_PATH = '/Users/mickael/development/MikaBot/agent-reports.json';

interface AgentReport {
  id: string;
  agent: 'trend' | 'risk' | 'news' | 'history' | 'master';
  timestamp: string;
  message: string;
  data: any;
  action?: string;
}

interface ReportsData {
  reports: AgentReport[];
  lastUpdated: string;
}

function getReportsData(): ReportsData {
  try {
    if (fs.existsSync(REPORTS_PATH)) {
      const content = fs.readFileSync(REPORTS_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.log('Could not read reports file, starting fresh');
  }
  return { reports: [], lastUpdated: new Date().toISOString() };
}

function saveReportsData(data: ReportsData) {
  try {
    fs.writeFileSync(REPORTS_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save reports:', e);
  }
}

export async function GET(request: Request) {
  const data = getReportsData();

  // Return last 10 reports sorted by timestamp descending
  const latestReports = data.reports
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return NextResponse.json({
    reports: latestReports,
    total: data.reports.length,
    lastUpdated: data.lastUpdated,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, message, data: reportData, action } = body;

    const data = getReportsData();

    // Add new report
    const newReport: AgentReport = {
      id: `${agent}-${Date.now()}`,
      agent,
      timestamp: new Date().toISOString(),
      message,
      data: reportData,
      action,
    };

    data.reports.push(newReport);
    data.lastUpdated = new Date().toISOString();

    // Keep only last 50 reports in storage (memory efficient)
    if (data.reports.length > 50) {
      data.reports = data.reports.slice(-50);
    }

    saveReportsData(data);

    return NextResponse.json({
      success: true,
      report: newReport,
      total: data.reports.length,
    });
  } catch (error) {
    console.error('Error adding report:', error);
    return NextResponse.json(
      { error: 'Failed to add report' },
      { status: 500 }
    );
  }
}

// Clear old reports
export async function DELETE(request: Request) {
  try {
    const data: ReportsData = { reports: [], lastUpdated: new Date().toISOString() };
    saveReportsData(data);
    return NextResponse.json({ success: true, message: 'Reports cleared' });
  } catch (error) {
    console.error('Error clearing reports:', error);
    return NextResponse.json(
      { error: 'Failed to clear reports' },
      { status: 500 }
    );
  }
}
