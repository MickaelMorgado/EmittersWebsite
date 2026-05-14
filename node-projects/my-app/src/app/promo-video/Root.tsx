"use client";

import { useState, useEffect } from "react";
import { AbsoluteFill, useVideoConfig, spring, interpolate, Audio } from "remotion";

const scene1Duration = 120;
const scene2Duration = 120;
const scene3Duration = 120;
const totalDuration = scene1Duration + scene2Duration + scene3Duration;

const FadeIn: React.FC<{ children: React.ReactNode; startFrame: number }> = ({ children, startFrame }) => {
  const { fps, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity }}>{children}</div>;
};

function useCurrentFrame() {
  return 0;
}

const Scene1: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 80, fontWeight: "bold", color: "#fff", marginBottom: 20, fontFamily: "system-ui" }}>
          <span style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Media Processor
          </span>
        </div>
        <div style={{ fontSize: 32, color: "#888" }}>
          Compress Images • Crop Videos • Export Anywhere
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, color: "#fff", marginBottom: 40 }}>Drop • Adjust • Download</div>
        <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
          <div style={{ background: "#1a1a2e", padding: 30, borderRadius: 16, border: "2px dashed #3b82f6" }}>
            <div style={{ fontSize: 64, marginBottom: 10 }}>📁</div>
            <div style={{ color: "#888" }}>Drop Images</div>
          </div>
          <div style={{ background: "#1a1a2e", padding: 30, borderRadius: 16, border: "2px solid #8b5cf6" }}>
            <div style={{ fontSize: 64, marginBottom: 10 }}>⚙️</div>
            <div style={{ color: "#888" }}>Set Target Size</div>
          </div>
          <div style={{ background: "#1a1a2e", padding: 30, borderRadius: 16, border: "2px solid #10b981" }}>
            <div style={{ fontSize: 64, marginBottom: 10 }}>⬇️</div>
            <div style={{ color: "#888" }}>Download ZIP</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene3: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f0f 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, color: "#fff", marginBottom: 20 }}>
          Multiple Video Presets
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", maxWidth: 800 }}>
          {["TikTok Portrait", "YouTube Shorts", "YouTube 16:9", "Square", "Story", "4K"].map((preset, i) => (
            <div key={preset} style={{ background: "#252540", padding: "20px 30px", borderRadius: 12, color: "#fff", fontSize: 20 }}>
              {preset}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 60, fontSize: 28, color: "#10b981" }}>
          Try it now →
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const composition = {
  id: "MediaProcessorPromo",
  durationInFrames: totalDuration,
  fps: 30,
  width: 1080,
  height: 1920,
};

export default function MediaProcessorPromo() {
  const { fps } = useVideoConfig();
  const [frame, setFrame] = useState(0);
  
  return (
    <AbsoluteFill style={{ width: "100%", height: "100%" }}>
      {frame < scene1Duration && <Scene1 />}
      {frame >= scene1Duration && frame < scene1Duration + scene2Duration && <Scene2 />}
      {frame >= scene1Duration + scene2Duration && <Scene3 />}
    </AbsoluteFill>
  );
}