"use client";

import { ChevronUp, Clock, Package, X } from "lucide-react";
import { useEffect, useState } from "react";
import versionsData from "@/data/versions.json";

interface VersionInfo {
  version: string;
  releasedAt: string;
  changes: string[];
}

interface ProjectVersions {
  current: VersionInfo;
  history: VersionInfo[];
}

type VersionsType = Record<string, ProjectVersions>;

const versions = versionsData as VersionsType;

function VersionBadge({ projectName }: { projectName: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const project = versions[projectName];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!project) return null;

  const { current, history } = project;
  const displayHistory = history.slice(0, 5);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 font-mono transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:border-white/30 hover:bg-black/80 transition-all duration-300 cursor-pointer"
        >
          <Package className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />
          <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors tracking-wider">
            v{current.version}
          </span>
          <ChevronUp className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-all duration-300 group-hover:rotate-180" />
        </button>
      ) : (
        <div className="w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-white/60" />
              <span className="text-xs font-medium text-white/80">
                {projectName}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/40 hover:text-white/80" />
            </button>
          </div>

          <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white">
                  v{current.version}
                </span>
                <span className="text-[10px] text-green-400/80 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                  Latest
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-2">
                <Clock className="w-3 h-3" />
                {formatDate(current.releasedAt)}
              </div>
              {current.changes.length > 0 && (
                <div className="space-y-1">
                  {current.changes.map((change, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-white/50 pl-2 border-l border-white/10"
                    >
                      {change}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {displayHistory.length > 1 && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-white/30 uppercase tracking-wider px-1">
                  Previous Versions
                </div>
                {displayHistory.slice(1).map((version, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] hover:bg-white/5 rounded-lg p-2.5 transition-colors border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/60">
                        v{version.version}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {formatDate(version.releasedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
        .animate-in {
          animation: fade-in 0.2s ease-out, zoom-in-95 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export { VersionBadge };
export type { VersionInfo, ProjectVersions };
