"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDualShock } from "./useDualShock";

const CONTROLLER_IMAGE_URL =
  "https://cdn.consolevariations.com/1197/ps3-jet-black-controller-transparent.webp";

type DraggablePosition = { x: number; y: number };

interface DraggableElement {
  id: string;
  position: DraggablePosition;
}

interface DraggableProps {
  element: DraggableElement;
  onPositionChange: (id: string, position: DraggablePosition) => void;
  locked: boolean;
  debugMode: boolean;
  children: React.ReactNode;
  className?: string;
}

const Draggable = ({
  element,
  onPositionChange,
  locked,
  debugMode,
  children,
  className,
}: DraggableProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elementX: number; elementY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (locked) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        elementX: element.position.x,
        elementY: element.position.y,
      });
    },
    [locked, element.position.x, element.position.y]
  );

  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const getParentRect = () => {
      if (!containerRef.current) return null;
      const parent = containerRef.current.parentElement;
      if (!parent) return null;
      return parent.getBoundingClientRect();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = getParentRect();
      if (!rect) return;
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100, dragStart.elementX + deltaX));
      const newY = Math.max(0, Math.min(100, dragStart.elementY + deltaY));
      onPositionChange(element.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, element.id, onPositionChange]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "absolute cursor-pointer",
        !locked && "hover:ring-1 hover:ring-white/30",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: `${element.position.x}%`,
        top: `${element.position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
      {debugMode && (
        <div
          className={clsx(
            "pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] font-mono text-cyan-400",
            isDragging && "bg-cyan-900/90"
          )}
        >
          x:{element.position.x.toFixed(1)} y:{element.position.y.toFixed(1)}
        </div>
      )}
      {debugMode && isDragging && (
        <>
          <div className="pointer-events-none absolute -left-4 top-1/2 h-px w-4 bg-cyan-400/60" />
          <div className="pointer-events-none absolute -right-4 top-1/2 h-px w-4 bg-cyan-400/60" />
          <div className="pointer-events-none absolute -top-4 left-1/2 h-4 w-px bg-cyan-400/60" />
          <div className="pointer-events-none absolute -bottom-4 left-1/2 h-4 w-px bg-cyan-400/60" />
        </>
      )}
    </div>
  );
};

const FACE_BUTTONS = [
  { id: "triangle", symbol: "△", color: "#66ffb3", position: { x: 73.8, y: 30.2 } },
  { id: "circle", symbol: "◯", color: "#ff5f7f", position: { x: 81.9, y: 40 } },
  { id: "cross", symbol: "✕", color: "#5da0ff", position: { x: 73.8, y: 52 } },
  { id: "square", symbol: "□", color: "#f687ff", position: { x: 65, y: 40 } },
] as const;

const SHOULDER_BUTTONS = [
  { id: "l2", label: "L2", position: { x: 19.4, y: 14.1 }, direction: "left" as const },
  { id: "l1", label: "L1", position: { x: 22.3, y: 20.8 }, direction: "left" as const },
  { id: "r2", label: "R2", position: { x: 71.6, y: 15.1 }, direction: "right" as const },
  { id: "r1", label: "R1", position: { x: 69.1, y: 22.4 }, direction: "right" as const },
];

const DPAD_BUTTONS = [
  { id: "dpadUp", label: "up", position: { x: 20.9, y: 35.5 } },
  { id: "dpadDown", label: "down", position: { x: 20.9, y: 48.0 } },
  { id: "dpadLeft", label: "left", position: { x: 15.6, y: 41.8 } },
  { id: "dpadRight", label: "right", position: { x: 26.2, y: 41.8 } },
];

const STICKS = [
  { id: "left", label: "L", position: { x: 42.5, y: 58.9 } },
  { id: "right", label: "R", position: { x: 57.7, y: 59.6 } },
] as const;

const PS_BUTTON = { id: "ps", position: { x: 45, y: 60 } } as const;

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const PanelChip = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
    <span className="text-[11px] uppercase tracking-widest text-white/50">{label}</span>
    <span className="text-sm font-mono text-white">{value}</span>
  </div>
);

const useBurstKey = (active: boolean) => {
  const [burstKey, setBurstKey] = useState(0);
  const previous = useRef(active);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (active && !previous.current) {
      setBurstKey((key) => key + 1);
    }
    previous.current = active;
  }, [active]);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setBurstKey((key) => key + 1);
      }, 150);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [active]);

  return burstKey;
};

type Particle = {
  dx: number;
  dy: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
};

const ParticleBurst = ({ color, burstKey }: { color: string; burstKey: number }) => {
  const particles = useMemo<Particle[]>(() => {
    if (!burstKey) return [];
    return Array.from({ length: 16 }).map(() => ({
      dx: (Math.random() - 0.5) * 120,
      dy: (Math.random() - 0.5) * 120,
      delay: Math.random() * 80,
      duration: 280 + Math.random() * 420,
      size: 6 + Math.random() * 12,
      opacity: 0.25 + Math.random() * 0.5,
    }));
  }, [burstKey]);

  if (!burstKey) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((particle, index) => {
        const style: CSSProperties & Record<string, number | string> = {
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          left: "50%",
          top: "50%",
          marginLeft: `-${particle.size / 2}px`,
          marginTop: `-${particle.size / 2}px`,
          background: color,
          boxShadow: `0 0 15px ${color}`,
          opacity: particle.opacity,
          animation: `particle-pop ${particle.duration}ms cubic-bezier(.2,.9,.4,1) ${particle.delay}ms forwards`,
          mixBlendMode: "screen",
          filter: "blur(0.5px)",
          position: "absolute",
          transform: "translate(-50%, -50%)",
          "--tx": `${particle.dx}px`,
          "--ty": `${particle.dy}px`,
        };

        return <span key={`${burstKey}-${index}`} style={style} className="rounded-full" />;
      })}
    </div>
  );
};

// Enhanced turbo jet animation with multi-layered flames and particle trails
const ExhaustPlume = ({
  value,
  direction,
}: {
  value: number;
  direction: "left" | "right";
}) => {
  const intensity = Math.min(1, Math.max(0, value));
  if (intensity < 0.02) return null;

  const isRight = direction === "right";
  const scale = 0.4 + intensity * 0.9;

  // Multi-layered flames with more detail and turbulence
  const flameStyles = [
    { scaleX: 2.8, scaleY: 2.2, opacity: 0.08 * intensity, blur: 32, hue: 30 },
    { scaleX: 2.3, scaleY: 1.9, opacity: 0.15 * intensity, blur: 24, hue: 35 },
    { scaleX: 1.9, scaleY: 1.6, opacity: 0.25 * intensity, blur: 18, hue: 40 },
    { scaleX: 1.5, scaleY: 1.3, opacity: 0.4 * intensity, blur: 12, hue: 50 },
    { scaleX: 1.1, scaleY: 1.0, opacity: 0.6 * intensity, blur: 6, hue: 60 },
    { scaleX: 0.7, scaleY: 0.65, opacity: 0.8 * intensity, blur: 2, hue: 50 },
  ];

  // Particle trail for enhanced detail
  const particles = useMemo(() => {
    const count = Math.ceil(5 * intensity);
    return Array.from({ length: count }).map((_, i) => ({
      offsetX: (Math.random() - 0.5) * 80 * intensity,
      offsetY: (Math.random() - 0.5) * 50 * intensity,
      delay: i * 40,
      duration: 350 + Math.random() * 250,
    }));
  }, [intensity]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{
        marginLeft: isRight ? "4px" : "0",
        marginRight: isRight ? "0" : "4px",
      }}
    >
      {flameStyles.map((flame, idx) => {
        const style: CSSProperties = {
          position: "absolute",
          top: "50%",
          left: isRight ? "100%" : undefined,
          right: isRight ? undefined : "100%",
          width: "170px",
          height: "90px",
          opacity: flame.opacity,
          transform: `translateY(-50%) scaleX(${flame.scaleX * scale}) scaleY(${flame.scaleY * scale})`,
          transformOrigin: isRight ? "left center" : "right center",
          background: isRight
            ? `linear-gradient(90deg, transparent 0%, hsl(${flame.hue}, 100%, 60%) 15%, hsl(${flame.hue - 10}, 100%, 50%) 50%, transparent 100%)`
            : `linear-gradient(270deg, transparent 0%, hsl(${flame.hue}, 100%, 60%) 15%, hsl(${flame.hue - 10}, 100%, 50%) 50%, transparent 100%)`,
          borderRadius: isRight ? "0 100% 100% 0" : "100% 0 0 100%",
          filter: `blur(${flame.blur}px)`,
          mixBlendMode: "screen",
          animation: `flame-flicker ${0.05 + idx * 0.025}s ease-in-out infinite alternate`,
          animationDelay: `${idx * 25}ms`,
          zIndex: idx,
        };
        return <div key={idx} style={style} />;
      })}

      {/* Particle trails */}
      {particles.map((p, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: "absolute",
            width: "6px",
            height: "6px",
            background: "radial-gradient(circle at 30% 30%, #ffff88, #ff9900)",
            borderRadius: "50%",
            left: isRight ? "100%" : undefined,
            right: isRight ? undefined : "100%",
            top: "50%",
            boxShadow: "0 0 10px #ffaa44",
            filter: "blur(1.5px)",
            opacity: 0.6,
            animation: `turbo-particle-trail ${p.duration}ms ease-out ${p.delay}ms forwards`,
            "--offsetX": `${isRight ? p.offsetX : -p.offsetX}px`,
            "--offsetY": `${p.offsetY}px`,
          } as CSSProperties & Record<string, string | number>}
        />
      ))}
    </div>
  );
};

// SVG D-Pad buttons - replaces ASCII characters
const DPadArrow = ({ direction }: { direction: "up" | "down" | "left" | "right" }) => {
  const rotations: Record<string, number> = {
    up: 0,
    right: 90,
    down: 180,
    left: 270,
  };

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      <polyline points="6 9 12 3 18 9"></polyline>
    </svg>
  );
};

const Stick = ({
  label,
  position: propPosition,
  x,
  y,
  element,
  onPositionChange,
  locked,
  debugMode,
}: {
  label: string;
  position: { x: number; y: number };
  x: number;
  y: number;
  element: DraggableElement;
  onPositionChange: (id: string, position: DraggablePosition) => void;
  locked: boolean;
  debugMode: boolean;
}) => {
  const offsetScale = 22;
  const magnitude = Math.min(1, Math.sqrt(x * x + y * y));
  const glowStrength = magnitude > 0.05 ? magnitude : 0;
  
  // Progressive opacity: 0% at center, 100% at full offset
  const stickOpacity = magnitude;

  return (
    <Draggable
      element={element}
      onPositionChange={onPositionChange}
      locked={locked}
      debugMode={debugMode}
    >
      <div className="flex flex-col items-center">
        <div
          className="relative h-28 w-28 rounded-full border border-white/10 bg-black/60 backdrop-blur"
          style={
            glowStrength
              ? {
                  boxShadow: `0 0 35px rgba(255,70,70,${0.3 + glowStrength * 0.5})`,
                  borderColor: `rgba(255,80,80,${0.2 + glowStrength * 0.5})`,
                }
              : undefined
          }
        >
          <div className="absolute inset-4 rounded-full border border-white/5" />
          {glowStrength > 0 && (
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(255,70,70,${glowStrength * 0.2}), transparent 60%)`,
                filter: "blur(10px)",
                opacity: glowStrength,
              }}
            />
          )}
          {/* Fixed thumb stick - properly centered with progressive opacity */}
          <div
            className="absolute h-12 w-12 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
            style={{
              background: stickOpacity > 0
                ? `radial-gradient(circle at 30% 30%, rgba(255, 120, 120, ${0.6 + stickOpacity * 0.4}), rgba(122, 15, 15, ${stickOpacity * 0.8}))`
                : "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))",
              // Properly center the stick (48px / 2 = 24px)
              left: "50%",
              top: "50%",
              marginLeft: "-24px",
              marginTop: "-24px",
              transform: `translate(calc(-50% + ${x * offsetScale}px), calc(-50% - ${y * offsetScale}px))`,
              transition: stickOpacity > 0 ? "none" : "background 150ms ease",
            }}
          />
          {stickOpacity > 0 && (
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                left: "50%",
                top: "50%",
                width: "36px",
                height: "36px",
                marginLeft: "-18px",
                marginTop: "-18px",
                transform: `translate(calc(-50% + ${x * offsetScale * 0.5}px), calc(-50% - ${y * offsetScale * 0.5}px))`,
                background: `radial-gradient(circle, rgba(255,200,100,${stickOpacity * 0.35}) 0%, transparent 70%)`,
                filter: "blur(4px)",
                opacity: stickOpacity,
              }}
            />
          )}
        </div>
      </div>
    </Draggable>
  );
};

const DPadButton = ({
  label,
  active,
  position: propPosition,
  element,
  onPositionChange,
  locked,
  debugMode,
}: {
  label: string;
  active: boolean;
  position: { x: number; y: number };
  element: DraggableElement;
  onPositionChange: (id: string, position: DraggablePosition) => void;
  locked: boolean;
  debugMode: boolean;
}) => (
  <Draggable
    element={element}
    onPositionChange={onPositionChange}
    locked={locked}
    debugMode={debugMode}
  >
    <div
      className={clsx(
        "flex h-14 w-14 items-center justify-center rounded-2xl border bg-black/40 text-white/60 transition-all",
        active && "border-cyan-400/60 text-cyan-300 shadow-[0_0_30px_rgba(59,228,255,0.4)]"
      )}
    >
      <DPadArrow direction={label as "up" | "down" | "left" | "right"} />
    </div>
  </Draggable>
);

const FaceButton = ({
  symbol,
  color,
  active,
  position: propPosition,
  element,
  onPositionChange,
  locked,
  debugMode,
}: {
  symbol: string;
  color: string;
  active: boolean;
  position: { x: number; y: number };
  element: DraggableElement;
  onPositionChange: (id: string, position: DraggablePosition) => void;
  locked: boolean;
  debugMode: boolean;
}) => {
  const burstKey = useBurstKey(active);
  return (
    <Draggable
      element={element}
      onPositionChange={onPositionChange}
      locked={locked}
      debugMode={debugMode}
    >
      <div
        className={clsx(
          "relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur transition-all",
          active && "scale-110 border-white/40"
        )}
      >
        <span className="text-2xl font-light" style={{ color }}>
          {symbol}
        </span>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}33, transparent 70%)`,
            opacity: active ? 1 : 0,
            transition: "opacity 150ms ease",
            filter: "blur(12px)",
          }}
        />
        <ParticleBurst color={color} burstKey={burstKey} />
      </div>
    </Draggable>
  );
};

const ShoulderButton = ({
  label,
  active,
  intensity,
  position: propPosition,
  direction,
  element,
  onPositionChange,
  locked,
  debugMode,
}: {
  label: string;
  active: boolean;
  intensity: number;
  position: { x: number; y: number };
  direction: "left" | "right";
  element: DraggableElement;
  onPositionChange: (id: string, position: DraggablePosition) => void;
  locked: boolean;
  debugMode: boolean;
}) => (
  <Draggable
    element={element}
    onPositionChange={onPositionChange}
    locked={locked}
    debugMode={debugMode}
  >
    <div
      className={clsx(
        "relative flex h-12 w-24 items-center justify-center rounded-2xl border border-white/10 bg-black/70 text-sm font-semibold tracking-[0.3em] text-white/50",
        active && "border-orange-400/60 text-orange-200"
      )}
    >
      {label}
      <div className="absolute inset-0 overflow-visible">
        <ExhaustPlume value={intensity} direction={direction} />
      </div>
    </div>
  </Draggable>
);

const ControllerExperience = () => {
  const state = useDualShock();
  const [positions, setPositions] = useState<Record<string, DraggablePosition>>({});
  const [locked, setLocked] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  const initializePosition = useCallback(
    (id: string, defaultPosition: DraggablePosition) => {
      if (!positions[id]) {
        setPositions((prev) => ({ ...prev, [id]: defaultPosition }));
      }
    },
    [positions]
  );

  const handlePositionChange = useCallback((id: string, position: DraggablePosition) => {
    setPositions((prev) => ({ ...prev, [id]: position }));
  }, []);

  const getPosition = useCallback(
    (id: string, defaultPosition: DraggablePosition) => {
      initializePosition(id, defaultPosition);
      return positions[id] || defaultPosition;
    },
    [initializePosition, positions]
  );

  const faceState = FACE_BUTTONS.map((button) => ({
    ...button,
    position: getPosition(button.id, button.position),
    active: state.buttons[button.id]?.pressed || (state.buttons[button.id]?.value ?? 0) > 0.2,
  }));
  const dpadState = DPAD_BUTTONS.map((button) => ({
    ...button,
    position: getPosition(button.id, button.position),
    active: state.buttons[button.id as keyof typeof state.buttons]?.pressed ?? false,
  }));

  const exportPositions = useCallback(() => {
    const allPositions: Record<string, DraggablePosition> = {};
    FACE_BUTTONS.forEach((btn) => {
      allPositions[btn.id] = getPosition(btn.id, btn.position);
    });
    DPAD_BUTTONS.forEach((btn) => {
      allPositions[btn.id] = getPosition(btn.id, btn.position);
    });
    SHOULDER_BUTTONS.forEach((btn) => {
      allPositions[btn.id] = getPosition(btn.id, btn.position);
    });
    STICKS.forEach((stick) => {
      allPositions[stick.id] = getPosition(stick.id, stick.position);
    });
    allPositions[PS_BUTTON.id] = getPosition(PS_BUTTON.id, PS_BUTTON.position);
    console.log("Current element positions:");
    console.log(JSON.stringify(allPositions, null, 2));
    return allPositions;
  }, [getPosition]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0000FF] text-white">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <p className="text-sm uppercase tracking-[0.5em] text-white/50">Realtime DualShock 3 Telemetry</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={clsx(
                  "rounded px-2 py-1 text-xs font-mono transition-colors",
                  debugMode
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                )}
              >
                DEBUG: {debugMode ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => setLocked(!locked)}
                className={clsx(
                  "rounded px-2 py-1 text-xs font-mono transition-colors",
                  !locked
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                )}
              >
                LOCK: {locked ? "ON" : "OFF"}
              </button>
              <button
                onClick={exportPositions}
                className="rounded bg-white/5 px-2 py-1 text-xs font-mono text-white/50 border border-white/10 hover:bg-white/10 transition-colors"
              >
                EXPORT
              </button>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight">PS3 Controller Particle Visualizer</h1>
          <p className="text-base text-white/70">
            {state.connected
              ? `Connected to ${state.gamepadName ?? "DualShock"}. Press, hold or squeeze anything to splash particles in realtime.`
              : "Press the PS button or any face button on your wired controller to wake it up."}
          </p>
          {!locked && (
            <p className="text-sm text-cyan-400/70">Drag elements to reposition them. Click EXPORT to log positions to console.</p>
          )}
        </header>

        <div className="flex flex-col gap-8 xl:flex-row">
          <section className="relative flex-1">
            <div className="relative mx-auto w-full max-w-4xl">
              <div className="relative mx-auto aspect-[16/8] w-full max-w-4xl overflow-visible">
                <img
                  src={CONTROLLER_IMAGE_URL}
                  alt="DualShock 3"
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-[0_35px_55px_rgba(0,0,0,0.8)]"
                  draggable={false}
                />

                {faceState.map((button) => (
                  <FaceButton
                    key={button.id}
                    symbol={button.symbol}
                    color={button.color}
                    active={button.active}
                    position={button.position}
                    element={{ id: button.id, position: button.position }}
                    onPositionChange={handlePositionChange}
                    locked={locked}
                    debugMode={debugMode}
                  />
                ))}

                {dpadState.map((button) => (
                  <DPadButton
                    key={button.id}
                    label={button.label}
                    active={button.active}
                    position={button.position}
                    element={{ id: button.id, position: button.position }}
                    onPositionChange={handlePositionChange}
                    locked={locked}
                    debugMode={debugMode}
                  />
                ))}

                {SHOULDER_BUTTONS.map((button) => {
                  const pos = getPosition(button.id, button.position);
                  return (
                    <ShoulderButton
                      key={button.id}
                      label={button.label}
                      position={pos}
                      direction={button.direction}
                      active={state.buttons[button.id as keyof typeof state.buttons]?.pressed ?? false}
                      intensity={state.buttons[button.id as keyof typeof state.buttons]?.value ?? 0}
                      element={{ id: button.id, position: pos }}
                      onPositionChange={handlePositionChange}
                      locked={locked}
                      debugMode={debugMode}
                    />
                  );
                })}

                {STICKS.map((stick) => {
                  const pos = getPosition(stick.id, stick.position);
                  return (
                    <Stick
                      key={stick.id}
                      label={stick.label}
                      position={pos}
                      x={state.sticks[stick.id as "left" | "right"].x}
                      y={state.sticks[stick.id as "left" | "right"].y}
                      element={{ id: stick.id, position: pos }}
                      onPositionChange={handlePositionChange}
                      locked={locked}
                      debugMode={debugMode}
                    />
                  );
                })}

                {(() => {
                  const psPos = getPosition(PS_BUTTON.id, PS_BUTTON.position);
                  return (
                    <Draggable
                      element={{ id: PS_BUTTON.id, position: psPos }}
                      onPositionChange={handlePositionChange}
                      locked={locked}
                      debugMode={debugMode}
                    >
                      <div className="flex flex-col items-center gap-1 text-xs font-mono uppercase tracking-[0.5em] text-white/40">
                        <span>PS</span>
                        <div
                          className={clsx(
                            "h-10 w-10 rounded-full border border-white/10",
                            state.buttons.ps?.pressed && "border-white/50 text-white"
                          )}
                        />
                      </div>
                    </Draggable>
                  );
                })()}
              </div>
            </div>
          </section>

          <aside className="w-full rounded-[32px] border border-white/5 bg-white/5 p-6 backdrop-blur xl:w-80">
            <div className="space-y-4">
              <PanelChip label="Status" value={state.connected ? "Connected" : "Waiting"} />
              <PanelChip label="Timestamp" value={state.timestamp ? `${Math.trunc(state.timestamp)}` : "0"} />
              <PanelChip label="Face Active" value={`${faceState.filter((btn) => btn.active).length}/4`} />
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Triggers</p>
              {(["l2", "r2"] as const).map((id) => {
                const value = state.buttons[id]?.value ?? 0;
                return (
                  <div key={id}>
                    <div className="mb-1 flex items-center justify-between text-xs font-mono text-white/70">
                      <span>{id.toUpperCase()}</span>
                      <span>{(value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-500 to-pink-500"
                        style={{ width: formatPercent(value) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Face Buttons</p>
              {faceState.map((button) => (
                <div key={button.id} className="flex items-center justify-between text-sm font-mono">
                  <span className="flex items-center gap-2">
                    <span className="text-base" style={{ color: button.color }}>
                      {button.symbol}
                    </span>
                    {button.id.toUpperCase()}
                  </span>
                  <span className={clsx(button.active ? "text-white" : "text-white/40")}>{button.active ? "ACTIVE" : "IDLE"}</span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-[10px] uppercase tracking-[0.4em] text-white/40">
              Tip: hold L2/R2 slowly to grow the exhaust plume, mash the face buttons for bursts.
            </p>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        @keyframes particle-pop {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) scale(1.15);
            opacity: 0;
          }
        }
        @keyframes flame-flicker {
          0% { transform: translateY(-50%) scaleX(1) scaleY(1); }
          50% { transform: translateY(-50%) scaleX(1.03) scaleY(0.97); }
          100% { transform: translateY(-50%) scaleX(0.97) scaleY(1.03); }
        }
        @keyframes turbo-particle-trail {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--offsetX, 0px)), calc(-50% + var(--offsetY, 0px))) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ControllerExperience;
