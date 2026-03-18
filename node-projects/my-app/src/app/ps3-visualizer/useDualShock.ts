"use client";

import { useEffect, useState } from "react";

export type DualShockButtonId =
  | "triangle"
  | "circle"
  | "cross"
  | "square"
  | "l1"
  | "r1"
  | "l2"
  | "r2"
  | "dpadUp"
  | "dpadDown"
  | "dpadLeft"
  | "dpadRight"
  | "select"
  | "start"
  | "ps"
  | "l3"
  | "r3";

export interface ButtonState {
  pressed: boolean;
  value: number;
}

export interface StickState {
  x: number;
  y: number;
  magnitude: number;
  angle: number;
}

export interface DualShockState {
  connected: boolean;
  gamepadName: string | null;
  timestamp: number;
  buttons: Record<DualShockButtonId, ButtonState>;
  sticks: {
    left: StickState;
    right: StickState;
  };
}

const BUTTON_MAPPING: Record<DualShockButtonId, number> = {
  cross: 0,
  circle: 1,
  square: 2,
  triangle: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  select: 8,
  start: 9,
  l3: 10,
  r3: 11,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
  ps: 16,
};

const BUTTON_IDS = Object.keys(BUTTON_MAPPING) as DualShockButtonId[];

const DEFAULT_BUTTONS = BUTTON_IDS.reduce((acc, key) => {
  acc[key as DualShockButtonId] = { pressed: false, value: 0 };
  return acc;
}, {} as Record<DualShockButtonId, ButtonState>);

const DEFAULT_STICK: StickState = { x: 0, y: 0, magnitude: 0, angle: 0 };

const INITIAL_STATE: DualShockState = {
  connected: false,
  gamepadName: null,
  timestamp: 0,
  buttons: { ...DEFAULT_BUTTONS },
  sticks: {
    left: { ...DEFAULT_STICK },
    right: { ...DEFAULT_STICK },
  },
};

const DEADZONE = 0.08;

const clampAxis = (value: number) => {
  if (Math.abs(value) < DEADZONE) return 0;
  return Number(value.toFixed(3));
};

const buildStickState = (horizontal = 0, vertical = 0): StickState => {
  const x = clampAxis(horizontal);
  const y = clampAxis(-vertical); // invert to match UI coordinates (up = positive)
  const magnitude = Math.min(1, Math.sqrt(x * x + y * y));
  const angle = magnitude === 0 ? 0 : Math.atan2(y, x);
  return { x, y, magnitude: Number(magnitude.toFixed(3)), angle };
};

const buildButtons = (pad: Gamepad): Record<DualShockButtonId, ButtonState> => {
  const next: Record<DualShockButtonId, ButtonState> = { ...DEFAULT_BUTTONS };
  BUTTON_IDS.forEach((id) => {
    const index = BUTTON_MAPPING[id];
    const raw = pad.buttons[index];
    next[id] = {
      pressed: Boolean(raw?.pressed),
      value: Number((raw?.value ?? 0).toFixed(3)),
    };
  });
  return next;
};

const buildStateFromPad = (pad: Gamepad): DualShockState => ({
  connected: true,
  gamepadName: pad.id,
  timestamp: pad.timestamp || performance.now(),
  buttons: buildButtons(pad),
  sticks: {
    left: buildStickState(pad.axes?.[0], pad.axes?.[1]),
    right: buildStickState(pad.axes?.[2], pad.axes?.[3]),
  },
});

const isDualShock = (pad: Gamepad | null): pad is Gamepad => {
  if (!pad) return false;
  return /dualshock|playstation|ps3/i.test(pad.id) || pad.mapping === "standard";
};

const almostEqual = (a: number, b: number, epsilon = 0.01) => Math.abs(a - b) < epsilon;

const sticksEqual = (a: StickState, b: StickState) =>
  almostEqual(a.x, b.x, 0.02) && almostEqual(a.y, b.y, 0.02) && almostEqual(a.magnitude, b.magnitude, 0.02);

const statesEqual = (prev: DualShockState, next: DualShockState) => {
  if (prev.connected !== next.connected) return false;
  if (prev.gamepadName !== next.gamepadName) return false;

  for (const id of BUTTON_IDS) {
    const prevButton = prev.buttons[id];
    const nextButton = next.buttons[id];
    if (prevButton.pressed !== nextButton.pressed) return false;
    if (!almostEqual(prevButton.value, nextButton.value, 0.02)) return false;
  }

  return sticksEqual(prev.sticks.left, next.sticks.left) && sticksEqual(prev.sticks.right, next.sticks.right);
};

export function useDualShock() {
  const [state, setState] = useState<DualShockState>(INITIAL_STATE);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    if (!navigator.getGamepads) {
      console.warn("Gamepad API not supported in this browser.");
      return;
    }

    let intervalId: NodeJS.Timeout;
    let isPageVisible = true;

    const updateFromGamepad = (pad: Gamepad | null) => {
      if (!pad) {
        setState((prev) => (prev.connected ? INITIAL_STATE : prev));
        return;
      }

      const next = buildStateFromPad(pad);
      setState((prev) => (statesEqual(prev, next) ? prev : next));
    };

    const poll = () => {
      const pads = navigator.getGamepads ? (Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[]) : [];
      const target = pads.find(isDualShock) ?? pads[0] ?? null;
      updateFromGamepad(target ?? null);
    };

    const handleConnect = (event: GamepadEvent) => {
      updateFromGamepad(event.gamepad);
    };

    const handleDisconnect = () => {
      setState(INITIAL_STATE);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageVisible = false;
        clearInterval(intervalId);
      } else {
        isPageVisible = true;
        poll();
        intervalId = setInterval(poll, 16);
      }
    };

    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    poll();
    intervalId = setInterval(poll, 16);

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
