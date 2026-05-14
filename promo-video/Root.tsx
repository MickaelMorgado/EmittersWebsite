import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring, Sequence } from "remotion";
import React from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;

const BLUE = "#3b82f6";
const PURPLE = "#8b5cf6";
const PINK = "#ec4899";
const GREEN = "#22c55e";
const BG = "#000";
const CARD_BG = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.5)";

// ─── SAMPLE IMAGES (colored rectangles with labels — no network deps) ─────────
const SAMPLE_IMGS = [
  { label: "mountain.jpg", size: "4.1 MB", compSize: "780 KB", bg: "linear-gradient(135deg,#1e3a5f,#2d6a9f)" },
  { label: "sunset.jpg",   size: "3.8 MB", compSize: "640 KB", bg: "linear-gradient(135deg,#7c2d12,#f97316)" },
  { label: "forest.jpg",   size: "5.2 MB", compSize: "920 KB", bg: "linear-gradient(135deg,#14532d,#4ade80)" },
  { label: "beach.jpg",    size: "2.9 MB", compSize: "510 KB", bg: "linear-gradient(135deg,#0c4a6e,#38bdf8)" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const ease = (f: number, from: number, to: number) =>
  interpolate(f, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ─── CURSOR ───────────────────────────────────────────────────────────────────
const Cursor: React.FC<{ x: number; y: number; clicking?: boolean; dragging?: boolean }> = ({ x, y, clicking, dragging }) => (
  <div style={{
    position: "absolute",
    left: x,
    top: y,
    zIndex: 9999,
    pointerEvents: "none",
    transform: `scale(${clicking || dragging ? 0.8 : 1})`,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
  }}>
    <svg width="28" height="28" viewBox="0 0 28 28">
      <path d="M6 2L22 14L15 16L12 24L6 2Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
    {clicking && (
      <div style={{
        position: "absolute",
        top: -16,
        left: -16,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.5)",
        opacity: 0.7,
      }} />
    )}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 5: RESIZE PRESETS  (390–480)
// ══════════════════════════════════════════════════════════════════════════════
const Scene5Resize: React.FC = () => {
  const f = useCurrentFrame();
  const presets = ["1080p", "720p", "Square", "Story", "OG Image"];
  const activeIdx = Math.floor(interpolate(f, [10, 70], [0, presets.length - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const cx = 1310 + activeIdx * 65;
  const cy = 645;
  const clicking = f > 15 && f % 18 < 6;

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab="images" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2" }}>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: 12 }}>
              {SAMPLE_IMGS.map((img, i) => (
                <div key={i} style={{ background: img.bg, borderRadius: 10, aspectRatio: "1" }} />
              ))}
            </div>
          </Card>
        </div>
        <Card>
            <CardTitle>⚙ Image Settings</CardTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 16, height: 16, background: BLUE, borderRadius: 3 }} />
              <span style={{ fontSize: 12, color: TEXT_DIM }}>✂ Resize to specific resolution</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8, fontSize: 13, color: "white" }}>1920</div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8, fontSize: 13, color: "white" }}>1080</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {presets.map((p, i) => (
                <div key={p} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, background: i === activeIdx ? BLUE : "rgba(255,255,255,0.1)", color: "white", fontWeight: i === activeIdx ? 700 : 400 }}>
                  {p}
                </div>
              ))}
</div>
          </Card>
        </div>
      <Cursor x={cx} y={cy} clicking={clicking} />
      <SceneLabel label="Resolution Presets" frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 6: COMPRESS + PROGRESS  (480–600)
// ══════════════════════════════════════════════════════════════════════════════
const Scene6Compress: React.FC = () => {
  const f = useCurrentFrame();
  const progress = interpolate(f, [20, 90], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isDone = f > 95;
  const cx = 1320;
  const cy = 760;
  const clicking = f < 10;

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab="images" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2" }}>
          <Card>
            <CardTitle>⚡ {isDone ? "Done!" : "Compressing..."}</CardTitle>
            {!isDone ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: 100, gap: 4, marginBottom: 24 }}>
                  {Array.from({ length: 20 }, (_, i) => {
                    const barH = interpolate(f, [20 + i * 2, 50 + i * 2], [20, 70 + Math.sin(i) * 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return <div key={i} style={{ width: 6, height: barH, background: `linear-gradient(to top,${BLUE},${PURPLE})`, borderRadius: 3 }} />;
                  })}
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg,${BLUE},${PURPLE},${PINK})`, borderRadius: 4, transition: "width 0.1s" }} />
                </div>
                <div style={{ fontSize: 14, color: TEXT_DIM }}>Processing {SAMPLE_IMGS.length} images... {Math.round(progress)}%</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: 12 }}>
                {SAMPLE_IMGS.map((img, i) => (
                  <div key={i} style={{ background: img.bg, borderRadius: 10, aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", padding: 8, position: "relative" }}>
                    <div style={{ background: `${GREEN}cc`, borderRadius: 100, padding: "3px 8px", fontSize: 10, color: "white", fontWeight: 700 }}>✓ Done</div>
                    <div style={{ width: "100%", background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "4px 6px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{img.label}</div>
                      <div style={{ fontSize: 10, color: GREEN }}>{img.size} → {img.compSize}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div>
          <Card>
            <CardTitle>⚙ Image Settings</CardTitle>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 16 }}>Target: 1.0 MB / image</div>
            <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />
            {isDone ? (
              <div style={{ height: 48, background: "transparent", border: `1px solid ${GREEN}80`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, fontWeight: 700, gap: 8 }}>
                ⬇ Download ZIP
              </div>
            ) : (
              <div style={{ height: 48, background: `linear-gradient(90deg,${BLUE},${PURPLE})`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                ⚡ Compressing...
              </div>
            )}
            {isDone && (
              <div style={{ marginTop: 16, fontSize: 12 }}>
                {[["Images", "4"], ["Original", "16.0 MB"], ["Compressed", "2.85 MB"], ["Saved", "82%"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: TEXT_DIM }}>{k}</span>
                    <span style={{ color: k === "Saved" || k === "Compressed" ? GREEN : "white", fontWeight: k === "Saved" ? 700 : 400 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      <Cursor x={cx} y={cy} clicking={clicking} />
      <SceneLabel label={isDone ? "Compression Complete — 82% Saved!" : "Compressing..."} frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 7: DOWNLOAD ZIP  (600–660)
// ══════════════════════════════════════════════════════════════════════════════
const Scene7Download: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, from: 0.8, to: 1, fps, config: { damping: 14 } });
  const cx = 1320;
  const cy = 690;

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab="images" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2" }}>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: 12 }}>
              {SAMPLE_IMGS.map((img, i) => (
                <div key={i} style={{ background: img.bg, borderRadius: 10, aspectRatio: "1", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8 }}>
                  <div style={{ background: `${GREEN}cc`, borderRadius: 100, padding: "3px 8px", fontSize: 10, color: "white", fontWeight: 700, alignSelf: "flex-start" }}>✓ Done</div>
                  <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "4px 6px" }}>
                    <div style={{ fontSize: 10, color: GREEN }}>{img.size} → {img.compSize}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <CardTitle>⚙ Image Settings</CardTitle>
            <div style={{ marginBottom: 12, fontSize: 12 }}>
              {[["Images", "4"], ["Original", "16.0 MB"], ["Compressed", "2.85 MB"], ["Saved", "82%"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: TEXT_DIM, fontSize: 12 }}>{k}</span>
                  <span style={{ color: k === "Saved" || k === "Compressed" ? GREEN : "white", fontWeight: k === "Saved" ? 700 : 400 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ transform: `scale(${s})`, transformOrigin: "center" }}>
              <div style={{ height: 52, background: "transparent", border: `1.5px solid ${GREEN}80`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, fontWeight: 700, fontSize: 16, gap: 10, boxShadow: `0 0 30px ${GREEN}30` }}>
                ⬇ Download ZIP
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Cursor x={cx} y={cy} clicking={f > 30 && f < 45} />
      <SceneLabel label="Download All as ZIP" frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 8: SWITCH TO VIDEOS TAB  (660–720)
// ══════════════════════════════════════════════════════════════════════════════
const Scene8VideoTab: React.FC = () => {
  const f = useCurrentFrame();
  const activeTab = f > 30 ? "videos" : "images";
  const cx = interpolate(f, [0, 25], [1580, 1680], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = 65;

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab={activeTab as "images" | "videos"} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2" }}>
          <Card>
            <CardTitle>📤 Upload Videos</CardTitle>
            <div style={{ border: "2px dashed rgba(255,255,255,0.2)", borderRadius: 16, padding: 60, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: 36 }}>🎬</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "white" }}>Drop videos here or click to browse</div>
              <div style={{ fontSize: 14, color: TEXT_DIM }}>Supports MP4, MOV, AVI, WebM</div>
            </div>
          </Card>
        </div>
        <div>
          <Card><CardTitle>✂ Video Crop Settings</CardTitle><div style={{ color: TEXT_DIM, fontSize: 12 }}>Preset Ratios</div></Card>
        </div>
      </div>
      <Cursor x={cx} y={cy} clicking={f > 25 && f < 38} />
      <SceneLabel label="Switch to Videos Tab" frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 9: VIDEO PRESETS  (720–840)
// ══════════════════════════════════════════════════════════════════════════════
const VIDEO_PRESETS_DATA = [
  { name: "TikTok Portrait", ratio: "9:16", icon: "📱", w: 1080, h: 1920 },
  { name: "YouTube Shorts",  ratio: "9:16", icon: "🎬", w: 1080, h: 1920 },
  { name: "YouTube 16:9",    ratio: "16:9", icon: "📺", w: 1920, h: 1080 },
  { name: "Square",          ratio: "1:1",  icon: "⬜", w: 1080, h: 1080 },
  { name: "Story",           ratio: "9:16", icon: "📖", w: 1080, h: 1920 },
  { name: "Landscape",       ratio: "16:9", icon: "🌄", w: 1920, h: 1080 },
  { name: "4K",              ratio: "16:9", icon: "🖥", w: 3840, h: 2160 },
];

const Scene9VideoPresets: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeIdx = Math.min(Math.floor(f / 15), VIDEO_PRESETS_DATA.length - 1);
  const active = VIDEO_PRESETS_DATA[activeIdx];
  const cx = 1275 + (activeIdx % 2) * 170;
  const cy = 350 + Math.floor(activeIdx / 2) * 76;
  const zoomScale = 1; // no zoom

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab="videos" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2" }}>
          <Card>
            <CardTitle>📤 Upload Videos</CardTitle>
            <div style={{ border: "2px dashed rgba(255,255,255,0.2)", borderRadius: 16, padding: 40, textAlign: "center" }}>
              <span style={{ fontSize: 48 }}>🎬</span>
              <div style={{ fontSize: 18, color: TEXT_DIM, marginTop: 12 }}>Drop videos here</div>
            </div>
          </Card>
        </div>
        <Card>
          <CardTitle>✂ Video Crop Settings</CardTitle>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>Preset Ratios</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {VIDEO_PRESETS_DATA.map((p, i) => (
                <div key={p.name} style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: i === activeIdx ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${i === activeIdx ? PURPLE : "transparent"}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: "white", fontWeight: i === activeIdx ? 700 : 400 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>{p.ratio}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: TEXT_DIM }}>Current: {active.w} × {active.h}</div>
          </Card>
        </div>
      <Cursor x={cx} y={cy} clicking={f % 15 < 5} />
      <SceneLabel label="Video Aspect Ratio Presets" frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 10: VIDEO WITH TRIM TIMELINE  (840–990)
// ══════════════════════════════════════════════════════════════════════════════
const Scene10Trim: React.FC = () => {
  const f = useCurrentFrame();
  const trimStart = interpolate(f, [30, 80], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const trimEnd = interpolate(f, [55, 110], [100, 75], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const handleX = interpolate(f, [55, 110], [920, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = 860;
  const zoomScale = 1; // no zoom

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab="videos" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Video preview */}
          <Card>
            <div style={{ background: "linear-gradient(135deg,#1e3a5f,#4a1080)", borderRadius: 12, aspectRatio: "16/7", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                <span style={{ fontSize: 28, marginLeft: 4 }}>▶</span>
              </div>
              <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 12, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 4 }}>Original</div>
              <div style={{ position: "absolute", bottom: 10, left: 100, fontSize: 12, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 4 }}>vacation_clip.mp4 • 1920×1080 • 30s</div>
            </div>
          </Card>
          {/* Trim timeline */}
          <Card style={{ border: `1px solid ${PURPLE}50` }}>
              <CardTitle>✂ Trim: vacation_clip.mp4</CardTitle>
              {/* Timeline strip */}
              <div style={{ height: 80, background: "rgba(0,0,0,0.4)", borderRadius: 10, overflow: "hidden", position: "relative", marginBottom: 10 }}>
                {/* Fake thumbnail strip */}
                <div style={{ display: "flex", height: "100%" }}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} style={{ flex: 1, background: `hsl(${200 + i * 8},60%,${20 + (i % 3) * 5}%)` }} />
                  ))}
                </div>
                {/* Selected region */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0,
                  left: `${trimStart}%`, width: `${trimEnd - trimStart}%`,
                  background: "rgba(139,92,246,0.3)", border: `2px solid ${PURPLE}`,
                }} />
                {/* Start handle */}
                <div style={{ position: "absolute", top: "50%", left: `${trimStart}%`, transform: "translateY(-50%)", width: 16, height: 40, background: PURPLE, borderRadius: 100, border: "2px solid white", boxShadow: "0 0 10px rgba(139,92,246,0.8)" }} />
                {/* End handle */}
                <div style={{ position: "absolute", top: "50%", left: `${trimEnd}%`, transform: "translateY(-50%)", width: 16, height: 40, background: PINK, borderRadius: 100, border: "2px solid white", boxShadow: "0 0 10px rgba(236,72,153,0.8)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT_DIM, marginBottom: 12 }}>
                <span>0:00</span><span>0:15</span><span>0:30</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: PURPLE }}>Start: {(trimStart / 100 * 30).toFixed(1)}s</span>
                <span style={{ background: "rgba(34,197,94,0.2)", color: GREEN, padding: "2px 10px", borderRadius: 100 }}>Duration: {((trimEnd - trimStart) / 100 * 30).toFixed(1)}s</span>
                <span style={{ color: PINK }}>End: {(trimEnd / 100 * 30).toFixed(1)}s</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {["Reset", "First Half", "Last Half"].map(b => (
                  <div key={b} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)", color: TEXT_DIM }}>{b}</div>
                ))}
              </div>
            </Card>
          </div>
        <div>
          <Card>
            <CardTitle>✂ Video Crop Settings</CardTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {VIDEO_PRESETS_DATA.slice(0, 4).map((p, i) => (
                <div key={p.name} style={{ padding: "8px 10px", borderRadius: 8, background: i === 0 ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)", border: `1.5px solid ${i === 0 ? PURPLE : "transparent"}`, fontSize: 11, color: "white" }}>
                  {p.icon} {p.name}
                </div>
              ))}
            </div>
            <div style={{ height: 48, background: `linear-gradient(90deg,${PURPLE},${PINK})`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
              ✂ Trim & Crop (1)
            </div>
          </Card>
        </div>
      </div>
      <Cursor x={handleX} y={cy} dragging={f > 55 && f < 115} />
      <SceneLabel label="Drag Handles to Trim Video" frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 11: FORMAT TOGGLE + PROCESS  (990–1080)
// ══════════════════════════════════════════════════════════════════════════════
const Scene11Format: React.FC = () => {
  const f = useCurrentFrame();
  const activeFormat = f > 35 ? "mp4" : "webm";
  const isProcessing = f > 60;
  const processPct = interpolate(f, [60, 110], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cx = f < 35 ? 1400 : 1500;
  const cy = 600;

  return (
    <AbsoluteFill style={{ padding: "48px 80px" }}>
      <AppHeader activeTab="videos" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        <div style={{ gridColumn: "span 2" }}>
          <Card>
            <CardTitle>{isProcessing ? "⚡ Processing Videos..." : "📤 Upload Videos"}</CardTitle>
            {isProcessing ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: 80, gap: 4, marginBottom: 20 }}>
                  {Array.from({ length: 20 }, (_, i) => {
                    const h = interpolate(f, [60 + i, 80 + i], [20, 60 + Math.cos(i) * 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return <div key={i} style={{ width: 6, height: h, background: `linear-gradient(to top,${PURPLE},${PINK})`, borderRadius: 3 }} />;
                  })}
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ width: `${processPct}%`, height: "100%", background: `linear-gradient(90deg,${PURPLE},${PINK})`, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 14, color: TEXT_DIM }}>Trimming & cropping videos... {Math.round(processPct)}%</div>
              </div>
            ) : (
              <div style={{ background: "linear-gradient(135deg,#1e3a5f,#4a1080)", borderRadius: 12, aspectRatio: "16/7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 32 }}>▶ vacation_clip.mp4</span>
              </div>
            )}
          </Card>
        </div>
        <div>
          <Card>
            <CardTitle>✂ Video Crop Settings</CardTitle>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 8 }}>Export Format</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["webm", "mp4"] as const).map(fmt => (
                <div key={fmt} style={{
                  flex: 1, padding: "14px 0", borderRadius: 10, textAlign: "center",
                  background: activeFormat === fmt ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${activeFormat === fmt ? PURPLE : "transparent"}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", textTransform: "uppercase" }}>{fmt}</div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>{fmt === "webm" ? "Default, fast" : "Better compat."}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: BORDER, margin: "12px 0" }} />
            <div style={{ height: 48, background: `linear-gradient(90deg,${PURPLE},${PINK})`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
              {isProcessing ? "⚡ Processing..." : "✂ Trim & Crop (1)"}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: TEXT_DIM, textAlign: "center" }}>
              All video processing happens in your browser.
            </div>
          </Card>
        </div>
      </div>
      <Cursor x={cx} y={cy} clicking={f > 30 && f < 45} />
      <SceneLabel label={f < 35 ? "WebM / MP4 Export Format" : "Processing Video..."} frame={f} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE 12: OUTRO  (1080–1170)
// ══════════════════════════════════════════════════════════════════════════════
const Scene12Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, from: 0.85, to: 1, fps, config: { damping: 16 } });
  const op = ease(f, 0, 25);
  const tagOp = ease(f, 25, 55);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", transform: `scale(${s})`, opacity: op }}>
        <div style={{ fontSize: 88, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: `linear-gradient(135deg,${BLUE},${PURPLE},${PINK})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 24 }}>
          Media Processor
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 40, opacity: tagOp }}>
          {[["🖼", "Image Compression"], ["✂", "Video Trimming"], ["📐", "Ratio Presets"], ["⬇", "ZIP Download"]].map(([icon, label]) => (
            <div key={label as string} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, color: TEXT_DIM }}>{label as string}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", opacity: tagOp }}>
          localhost:3001/image-compressor
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROOT COMPOSITION
// ══════════════════════════════════════════════════════════════════════════════
export const MediaProcessorPromo: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "white" }}>
    <DarkBG />
    <Sequence from={0}    durationInFrames={60}><Scene1Title /></Sequence>
    <Sequence from={60}   durationInFrames={90}><Scene2Overview /></Sequence>
    <Sequence from={150}  durationInFrames={120}><Scene3DragDrop /></Sequence>
    <Sequence from={270}  durationInFrames={120}><Scene4Slider /></Sequence>
    <Sequence from={390}  durationInFrames={90}><Scene5Resize /></Sequence>
    <Sequence from={480}  durationInFrames={120}><Scene6Compress /></Sequence>
    <Sequence from={600}  durationInFrames={60}><Scene7Download /></Sequence>
    <Sequence from={660}  durationInFrames={60}><Scene8VideoTab /></Sequence>
    <Sequence from={720}  durationInFrames={120}><Scene9VideoPresets /></Sequence>
    <Sequence from={840}  durationInFrames={150}><Scene10Trim /></Sequence>
    <Sequence from={990}  durationInFrames={90}><Scene11Format /></Sequence>
    <Sequence from={1080} durationInFrames={90}><Scene12Outro /></Sequence>
  </AbsoluteFill>
);

export const ImageCompressorPromo = MediaProcessorPromo;
