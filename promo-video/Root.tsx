import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring, Sequence } from "remotion";

const DarkBackground = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <div style={{
      position: "absolute",
      top: "-20%",
      left: "-20%",
      width: "50%",
      height: "50%",
      background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
      filter: "blur(80px)",
    }} />
    <div style={{
      position: "absolute",
      bottom: "-20%",
      right: "-20%",
      width: "50%",
      height: "50%",
      background: "radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)",
      filter: "blur(80px)",
    }} />
  </AbsoluteFill>
);

const TitleSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({ frame, from: 0.8, to: 1, fps });
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        textAlign: "center",
        transform: `scale(${scale})`,
        opacity,
      }}>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 20,
          textShadow: "0 0 60px rgba(139, 92, 246, 0.5)",
        }}>
          Image Compressor
        </div>
        <div style={{
          fontSize: 24,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}>
          Compress • Optimize • Save
        </div>
      </div>
    </AbsoluteFill>
  );
};

const UploadSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const dropZoneOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const borderProgress = interpolate(frame, [30, 90], [0, 1], { extrapolateRight: "clamp" });
  const iconScale = spring({ frame: frame - 30, from: 0.5, to: 1, fps });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        width: 600,
        height: 400,
        borderRadius: 24,
        background: "rgba(255,255,255,0.03)",
        border: "2px dashed rgba(255,255,255,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: dropZoneOpacity,
        borderColor: `rgba(59, 130, 246, ${borderProgress})`,
        background: `rgba(59, 130, 246, ${borderProgress * 0.05})`,
      }}>
        <div style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 30,
          transform: `scale(${iconScale})`,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 600,
          color: "white",
          marginBottom: 8,
        }}>
          Drop images here
        </div>
        <div style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.5)",
        }}>
          Supports JPG, PNG, WebP, GIF
        </div>
        <div style={{
          position: "absolute",
          bottom: -15,
          background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
          padding: "8px 24px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 600,
        }}>
          Multiple Images Supported
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SliderSlide = () => {
  const frame = useCurrentFrame();
  
  const sliderWidth = interpolate(frame, [0, 60], [0, 400], { extrapolateRight: "clamp" });
  const valueOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 20,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 20,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          Set Target File Size
        </div>
        <div style={{
          width: 500,
          height: 80,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}>
          <div style={{
            width: 400,
            height: 8,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: sliderWidth,
              height: "100%",
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
              borderRadius: 4,
            }} />
            <div style={{
              position: "absolute",
              left: sliderWidth - 12,
              top: -8,
              width: 24,
              height: 24,
              background: "white",
              borderRadius: "50%",
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
            }} />
          </div>
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: valueOpacity,
        }}>
          1.5 MB
        </div>
        <div style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.4)",
          marginTop: 10,
        }}>
          Adjust from 0.1 MB to 10 MB per image
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CompressionSlide = () => {
  const frame = useCurrentFrame();
  
  const progress = interpolate(frame, [0, 90], [0, 100], { extrapolateRight: "clamp" });
  
  const renderBars = () => {
    return Array.from({ length: 20 }, (_, i) => {
      const delay = i * 3;
      const height = interpolate(frame, [delay, delay + 30], [20, 80], { extrapolateRight: "clamp" });
      return (
        <div
          key={i}
          style={{
            width: 6,
            height: Math.min(height, 80),
            background: "linear-gradient(to top, #3b82f6, #8b5cf6)",
            borderRadius: 3,
            margin: "0 2px",
          }}
        />
      );
    });
  };

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        textAlign: "center",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          height: 120,
          marginBottom: 40,
        }}>
          {renderBars()}
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: "white",
          marginBottom: 10,
        }}>
          Compressing...
        </div>
        <div style={{
          width: 300,
          height: 8,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 4,
          overflow: "hidden",
          margin: "0 auto",
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
            borderRadius: 4,
          }} />
        </div>
        <div style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.5)",
          marginTop: 15,
        }}>
          Client-side processing • Secure & fast
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ResultsSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const savedOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const savedScale = spring({ frame, from: 0.5, to: 1, fps });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        textAlign: "center",
        transform: `scale(${savedScale})`,
        opacity: savedOpacity,
      }}>
        <div style={{
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 20,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>
          Results
        </div>
        <div style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 30,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 8,
            }}>
              Original
            </div>
            <div style={{
              fontSize: 36,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}>
              4.2 MB
            </div>
          </div>
          <div style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.3)",
          }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 8,
            }}>
              Compressed
            </div>
            <div style={{
              fontSize: 36,
              fontWeight: 600,
              color: "#22c55e",
            }}>
              1.4 MB
            </div>
          </div>
        </div>
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          background: "linear-gradient(135deg, #22c55e, #10b981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 60px rgba(34, 197, 94, 0.5)",
        }}>
          67% SAVED
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DownloadSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const buttonScale = spring({ frame, from: 0.8, to: 1, fps });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        transform: `scale(${buttonScale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{
          width: 200,
          height: 80,
          background: "linear-gradient(135deg, #22c55e, #10b981)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 30,
          boxShadow: "0 10px 40px rgba(34, 197, 94, 0.4)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span style={{ fontSize: 24, fontWeight: 700, color: "white" }}>
            Download ZIP
          </span>
        </div>
        <div style={{
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
        }}>
          All images compressed and ready
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PrivacySlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = spring({ frame, from: 0, to: 1, fps });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        textAlign: "center",
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: "white",
            marginBottom: 8,
          }}>
            100% Private
          </div>
          <div style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.5)",
          }}>
            All processing happens in your browser.<br />
            Your images are never uploaded to any server.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndSlide = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = spring({ frame, from: 0, to: 1, fps });
  const scale = spring({ frame, from: 0.8, to: 1, fps });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        textAlign: "center",
        transform: `scale(${scale})`,
        opacity,
      }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 30,
        }}>
          Try It Now
        </div>
        <div style={{
          fontSize: 20,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.1em",
        }}>
          /image-compressor
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ImageCompressorPromo = () => {
  return (
    <AbsoluteFill>
      <DarkBackground />
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <UploadSlide />
      </Sequence>
      <Sequence from={180} durationInFrames={90}>
        <SliderSlide />
      </Sequence>
      <Sequence from={270} durationInFrames={90}>
        <CompressionSlide />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <ResultsSlide />
      </Sequence>
      <Sequence from={450} durationInFrames={90}>
        <DownloadSlide />
      </Sequence>
      <Sequence from={540} durationInFrames={60}>
        <PrivacySlide />
      </Sequence>
      <Sequence from={600} durationInFrames={90}>
        <EndSlide />
      </Sequence>
    </AbsoluteFill>
  );
};
