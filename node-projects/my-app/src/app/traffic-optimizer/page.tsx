'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTomTomRoutes } from './tomtom';
import { Route, TrafficLevel } from './types';
import { overallTrafficLevel, TRAFFIC_LABELS, trafficColor } from './utils';

// Dynamic import — TomTom SDK touches window/document
const TomTomMap = dynamic(() => import('./TomTomMap'), { ssr: false });

const REFRESH_INTERVAL = 60; // seconds — TomTom free tier is 2,500 req/day
const KEY_STORAGE = 'tomtom_api_key';
const ENV_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

function TrafficBadge({ level }: { level: TrafficLevel }) {
  const config = {
    low: { label: 'Light traffic', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    medium: { label: 'Moderate', bg: 'bg-orange-400/20', border: 'border-orange-400/40', text: 'text-orange-300', dot: 'bg-orange-300' },
    high: { label: 'Heavy traffic', bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-400' },
    severe: { label: 'Severe jams', bg: 'bg-red-900/40', border: 'border-red-800/60', text: 'text-red-300', dot: 'bg-red-700' },
  }[level];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
}

/** Google Maps style horizontal traffic strip — each portion colored by congestion */
function TrafficStrip({ route }: { route: Route }) {
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5" title="Traffic along route">
      {route.segments.map((seg, i) => (
        <div
          key={i}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{
            width: `${seg.share * 100}%`,
            backgroundColor: trafficColor(seg.trafficLevel),
          }}
        />
      ))}
    </div>
  );
}

function RouteCard({
  route,
  rank,
  isSelected,
  isBest,
  onClick,
}: {
  route: Route;
  rank: number;
  isSelected: boolean;
  isBest: boolean;
  onClick: () => void;
}) {
  const eta = route.etaMin;
  const delay = eta - route.baseDurationMin;
  const overall = overallTrafficLevel(route);
  const distKm = (route.distanceM / 1000).toFixed(1);
  // ETA color like Google: green when close to base time, red when heavily delayed
  const etaColor =
    delay <= 2 ? 'text-emerald-400' : delay <= 8 ? 'text-orange-300' : 'text-red-400';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
        isSelected
          ? 'border-white/30 bg-white/5 shadow-lg'
          : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15'
      }`}
      style={isSelected ? { boxShadow: `0 0 24px -4px ${route.color}40` } : {}}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Rank badge */}
          <span className="text-xs font-bold text-white/40 w-4">{rank}</span>
          {/* Route identity color (like Google's route colors) */}
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: route.color, boxShadow: `0 0 8px ${route.color}` }}
          />
          <span className="font-semibold text-white text-sm">{route.name}</span>
          {isBest && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              BEST
            </span>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-xl font-bold tabular-nums ${etaColor}`}>
            {eta}<span className="text-xs text-white/40 font-normal"> min</span>
          </span>
          {delay > 2 && (
            <div className="text-[10px] text-white/30 tabular-nums">
              typically {route.baseDurationMin} min
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-white/40 mb-2 pl-6">{route.description}</p>

      {/* Traffic heaviness by portion — Google Maps style */}
      <div className="pl-6 mb-3">
        <TrafficStrip route={route} />
      </div>

      <div className="flex items-center justify-between pl-6">
        <TrafficBadge level={overall} />
        <span className="text-xs text-white/30">{distKm} km</span>
      </div>
    </button>
  );
}

function RefreshTimer({ countdown, onRefresh, isRefreshing }: {
  countdown: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const pct = (countdown / REFRESH_INTERVAL) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500/60 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-white/30 tabular-nums w-12 text-right">
        {isRefreshing ? '...' : `${countdown}s`}
      </span>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-xs px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all disabled:opacity-40"
      >
        {isRefreshing ? 'Updating...' : 'Refresh'}
      </button>
    </div>
  );
}

function rankRoutes(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => a.etaMin - b.etaMin);
}

// ─── API key setup screen ─────────────────────────────────────────────────────

function KeySetup({ onSave, error }: { onSave: (key: string) => void; error: string | null }) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 bg-[#020812] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-sm font-bold text-white tracking-widest uppercase mb-1">
          Traffic Route Optimizer
        </h1>
        <p className="text-xs text-white/40 mb-5">
          Live traffic needs a TomTom API key (free tier: 2,500 requests/day).
        </p>

        <ol className="text-xs text-white/50 space-y-1.5 mb-5 list-decimal list-inside">
          <li>
            Create a free account at{' '}
            <a
              href="https://developer.tomtom.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              developer.tomtom.com
            </a>
          </li>
          <li>Dashboard → API &amp; SDK Keys → your key</li>
          <li>Paste it below (stored in this browser only)</li>
        </ol>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onSave(value.trim());
          }}
          className="space-y-3"
        >
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="TomTom API key"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-4 py-3 rounded-xl focus:border-blue-500/60 focus:outline-none font-mono"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Start live traffic
          </button>
        </form>

        <p className="text-[10px] text-white/25 mt-4">
          Tip: set <code className="text-white/40">NEXT_PUBLIC_TOMTOM_API_KEY</code> in{' '}
          <code className="text-white/40">.env.local</code> to skip this screen.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrafficOptimizerPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyChecked, setKeyChecked] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve API key: env var → localStorage
  useEffect(() => {
    if (ENV_KEY) {
      setApiKey(ENV_KEY);
    } else {
      const stored = localStorage.getItem(KEY_STORAGE);
      if (stored) setApiKey(stored);
    }
    setKeyChecked(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!apiKey) return;
    setIsRefreshing(true);
    setCountdown(REFRESH_INTERVAL);
    try {
      const newRoutes = await fetchTomTomRoutes(apiKey);
      setRoutes(newRoutes);
      setLastUpdated(new Date());
      setFetchError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch routes';
      // Invalid key → drop back to setup screen
      if (msg.includes('403')) {
        localStorage.removeItem(KEY_STORAGE);
        setKeyError(msg);
        setApiKey(null);
        setRoutes([]);
      } else {
        setFetchError(msg);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [apiKey]);

  // Initial load + on key change
  useEffect(() => {
    if (apiKey) refresh();
  }, [apiKey, refresh]);

  // Countdown + auto-refresh
  useEffect(() => {
    if (!apiKey) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refresh();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [apiKey, refresh]);

  const handleSaveKey = (key: string) => {
    localStorage.setItem(KEY_STORAGE, key);
    setKeyError(null);
    setApiKey(key);
  };

  const rankedRoutes = rankRoutes(routes);
  const bestRouteId = rankedRoutes[0]?.id;

  const handleRouteClick = (routeId: string) => {
    setSelectedRouteId((prev) => (prev === routeId ? null : routeId));
  };

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  if (!keyChecked) return <div className="fixed inset-0 bg-[#020812]" />;
  if (!apiKey) return <KeySetup onSave={handleSaveKey} error={keyError} />;

  return (
    <div className="fixed inset-0 bg-[#020812] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-white/8 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-white tracking-widest uppercase">
            Traffic Route Optimizer
          </h1>
          <p className="text-xs text-white/30">Faro · Gambelas → Cidade · TomTom live traffic</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live traffic
          </span>
          <span className="text-xs text-white/20">Updated: {lastUpdatedStr}</span>
          <button
            onClick={() => {
              localStorage.removeItem(KEY_STORAGE);
              setApiKey(null);
              setRoutes([]);
            }}
            className="text-[10px] px-2 py-1 rounded border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-colors"
            title="Change TomTom API key"
          >
            Key
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-white/8 flex flex-col overflow-hidden">
          {/* Route header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Routes</span>
              <span className="text-xs text-white/25">{routes.length} alternatives</span>
            </div>
          </div>

          {/* Origin / Destination */}
          <div className="mx-4 mb-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5 flex-shrink-0 shadow-[0_0_6px_#00ff88]" />
              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">From</div>
                <div className="text-xs text-white/80 font-medium">Praceta da Boavista 5</div>
                <div className="text-[10px] text-white/40">Gambelas, Faro</div>
              </div>
            </div>
            <div className="ml-1 w-px h-3 bg-white/15 mx-[3px]" />
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 mt-0.5 flex-shrink-0 shadow-[0_0_6px_#ff4444]" />
              <div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">To</div>
                <div className="text-xs text-white/80 font-medium">R. Gen. Teofilo da Trindade 29</div>
                <div className="text-[10px] text-white/40">Faro City Center</div>
              </div>
            </div>
          </div>

          {/* Fetch error banner */}
          {fetchError && (
            <div className="mx-4 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              <p className="text-xs text-red-300">{fetchError}</p>
            </div>
          )}

          {/* Route cards */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
            {routes.length === 0 && !fetchError && (
              <div className="text-xs text-white/30 text-center py-8">Fetching live routes...</div>
            )}
            {rankedRoutes.map((route, idx) => (
              <RouteCard
                key={route.id}
                route={route}
                rank={idx + 1}
                isSelected={selectedRouteId === route.id}
                isBest={route.id === bestRouteId}
                onClick={() => handleRouteClick(route.id)}
              />
            ))}
          </div>

          {/* Refresh section */}
          <div className="flex-shrink-0 border-t border-white/8 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>Auto-refresh</span>
              <span>every {REFRESH_INTERVAL}s</span>
            </div>
            <RefreshTimer
              countdown={countdown}
              onRefresh={refresh}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>

        {/* TomTom map */}
        <div className="flex-1 relative min-h-0 h-full overflow-hidden">
          <TomTomMap
            apiKey={apiKey}
            routes={routes}
            selectedRouteId={selectedRouteId}
          />

          {/* Map legend overlay — Google Maps traffic scale */}
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 px-3 py-2.5 z-10">
            <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1.5">Route traffic</span>
            <div className="flex h-2 w-36 rounded-full overflow-hidden mb-1.5">
              {(['low', 'medium', 'high', 'severe'] as const).map((level) => (
                <div
                  key={level}
                  className="flex-1 h-full"
                  style={{ backgroundColor: trafficColor(level) }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-white/40">
              <span>{TRAFFIC_LABELS.low}</span>
              <span>{TRAFFIC_LABELS.severe}</span>
            </div>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-4 left-4 text-[10px] text-white/40 space-y-0.5 z-10 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
            <div>Road colors = live TomTom traffic flow</div>
            <div>Click route card to isolate</div>
          </div>

          {/* Refreshing indicator */}
          {isRefreshing && routes.length > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="text-xs text-white/70 bg-black/70 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                Updating traffic...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
