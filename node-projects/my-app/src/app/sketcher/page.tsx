"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// --- Types ---
interface Point { x: number; y: number }
interface Point3D { x: number; y: number; z: number }
interface Element {
  id: string;
  type: string;
  points3D: Point3D[];
  sourceView: ViewId;
  hatch?: boolean;
}
interface Camera { panX: number; panY: number; zoom: number }

type ViewId = "top" | "front" | "right" | "left" | "bottom" | "back";
type ToolId = "line" | "rect" | "circle" | "centerline";

// --- Constants ---
const BG = "#0c1220";
const BG_PANEL = "#0c1220";
const BG_CONTAINER = `linear-gradient(#141c3850 1px, transparent 1px), linear-gradient(90deg, #141c3850 1px, transparent 1px)`;
const GRID_COLOR = "#141c3850";
const GRID_MAJOR = "#141c3850";
const LINE_COLOR = "#e8e8e8";
const DIM_COLOR = "#c0c0c0";
const CENTERLINE_COLOR = "#cc4444";
const PREVIEW_COLOR = "#4d88e6";
const GHOST_LINE = "#404d70";
const GHOST_CENTER = "#6a3333";
const GRID_SIZE = 20;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 8;
const ZOOM_SPEED = 0.001;
const CIRCLE_SAMPLES = 64;

const ALL_VIEWS: ViewId[] = ["top", "front", "right", "left", "bottom", "back"];

// --- Utilities ---
function dist2(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function dist3(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}
function snap(p: Point, s: number): Point {
  return { x: Math.round(p.x / s) * s, y: Math.round(p.y / s) * s };
}
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

// --- View projections (3rd-angle orthographic) ---
// Each view maps local 2D (h right, v up) <-> world 3D
interface ViewDef {
  name: string;
  axes: [string, string];
  to3D: (h: number, v: number) => Point3D;
  to2D: (p: Point3D) => Point;
}

const V: Record<ViewId, ViewDef> = {
  front:  { name: "FRONT",  axes: ["X", "Y"], to3D: (h, v) => ({ x: h, y: v, z: 0 }),  to2D: p => ({ x: p.x,  y: p.y }) },
  back:   { name: "BACK",   axes: ["X", "Y"], to3D: (h, v) => ({ x: -h, y: v, z: 0 }), to2D: p => ({ x: -p.x, y: p.y }) },
  top:    { name: "TOP",    axes: ["X", "Z"], to3D: (h, v) => ({ x: h, y: 0, z: -v }),  to2D: p => ({ x: p.x,  y: -p.z }) },
  bottom: { name: "BOTTOM", axes: ["X", "Z"], to3D: (h, v) => ({ x: h, y: 0, z: v }),   to2D: p => ({ x: p.x,  y: p.z }) },
  right:  { name: "RIGHT",  axes: ["Z", "Y"], to3D: (h, v) => ({ x: 0, y: v, z: -h }),  to2D: p => ({ x: -p.z, y: p.y }) },
  left:   { name: "LEFT",   axes: ["Z", "Y"], to3D: (h, v) => ({ x: 0, y: v, z: h }),   to2D: p => ({ x: p.z,  y: p.y }) },
};

// --- Drawing helpers ---
function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, sz = 6) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - sz * Math.cos(a - Math.PI / 7), y2 - sz * Math.sin(a - Math.PI / 7));
  ctx.lineTo(x2 - sz * Math.cos(a + Math.PI / 7), y2 - sz * Math.sin(a + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

function drawDimLine(
  ctx: CanvasRenderingContext2D, a: Point, b: Point,
  offset: number, horizontal: boolean, value: number,
  color = DIM_COLOR, bg = BG_PANEL,
) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 0.4;
  ctx.font = "italic 11px system-ui, sans-serif";

  let x1: number, y1: number, x2: number, y2: number;
  let ex1a: number, ey1a: number, ex1b: number, ey1b: number;
  let ex2a: number, ey2a: number, ex2b: number, ey2b: number;

  if (horizontal) {
    x1 = a.x; x2 = b.x;
    y1 = y2 = offset > 0 ? Math.min(a.y, b.y) - Math.abs(offset) : Math.max(a.y, b.y) + Math.abs(offset);
    ex1a = a.x; ey1a = a.y; ex1b = x1; ey1b = y1 - 4 * Math.sign(offset);
    ex2a = b.x; ey2a = b.y; ex2b = x2; ey2b = y2 - 4 * Math.sign(offset);
  } else {
    y1 = a.y; y2 = b.y;
    x1 = x2 = offset > 0 ? Math.max(a.x, b.x) + Math.abs(offset) : Math.min(a.x, b.x) - Math.abs(offset);
    ex1a = a.x; ey1a = a.y; ex1b = x1 + 4 * Math.sign(offset); ey1b = y1;
    ex2a = b.x; ey2a = b.y; ex2b = x2 + 4 * Math.sign(offset); ey2b = y2;
  }

  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(ex1a, ey1a); ctx.lineTo(ex1b, ey1b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex2a, ey2a); ctx.lineTo(ex2b, ey2b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  drawArrow(ctx, x2, y2, x1, y1, 5);
  drawArrow(ctx, x1, y1, x2, y2, 5);

  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const label = `${Math.round(value)}`;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = bg;
  ctx.fillRect(mx - tw / 2 - 3, my - 7, tw + 6, 14);
  ctx.fillStyle = color;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, mx, my);
  ctx.restore();
}

function drawCL(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = CENTERLINE_COLOR) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 0.7;
  ctx.setLineDash([12, 3, 3, 3]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawHatch(ctx: CanvasRenderingContext2D, pts: Point[]) {
  if (pts.length < 3) return;
  ctx.save();
  ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = 0.4; ctx.globalAlpha = 0.35;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.clip();

  const spacing = 6;
  const total = (maxX - minX) + (maxY - minY);
  for (let d = -total; d < total; d += spacing) {
    ctx.beginPath(); ctx.moveTo(minX + d, minY); ctx.lineTo(minX + d + (maxY - minY), maxY); ctx.stroke();
  }
  ctx.restore();
}

// Get 4 screen-space corners of a rect element projected into view v
function rectCorners(el: Element, proj: ViewDef, ts: (p: Point3D) => Point): Point[] {
  const src = V[el.sourceView];
  const l0 = src.to2D(el.points3D[0]);
  const l1 = src.to2D(el.points3D[1]);
  return [
    ts(el.points3D[0]),
    ts(src.to3D(l1.x, l0.y)),
    ts(el.points3D[1]),
    ts(src.to3D(l0.x, l1.y)),
  ];
}

// Sample a circle element into screen points for a given view
function circleScreenPts(el: Element, ts: (p: Point3D) => Point): Point[] {
  const src = V[el.sourceView];
  const hDir = src.to3D(1, 0);
  const vDir = src.to3D(0, 1);
  const c = el.points3D[0];
  const r = dist3(el.points3D[0], el.points3D[1]);
  const pts: Point[] = [];
  for (let i = 0; i <= CIRCLE_SAMPLES; i++) {
    const angle = (i / CIRCLE_SAMPLES) * Math.PI * 2;
    const co = Math.cos(angle), si = Math.sin(angle);
    pts.push(ts({
      x: c.x + r * (co * hDir.x + si * vDir.x),
      y: c.y + r * (co * hDir.y + si * vDir.y),
      z: c.z + r * (co * hDir.z + si * vDir.z),
    }));
  }
  return pts;
}

function initCameras(): Record<ViewId, Camera> {
  const c: Partial<Record<ViewId, Camera>> = {};
  for (const v of ALL_VIEWS) c[v] = { panX: 0, panY: 0, zoom: 1 };
  return c as Record<ViewId, Camera>;
}

// ============ Component ============
export default function Page() {
  const [tool, setTool] = useState<ToolId>("line");
  const [active, setActive] = useState<ViewId>("front");
  const [hatchMode, setHatchMode] = useState(false);
  const [, bump] = useState(0);

  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [drawPts, setDrawPts] = useState<Point[]>([]); // local (h,v) of active view

  const canvases = useRef<Record<ViewId, HTMLCanvasElement | null>>(
    Object.fromEntries(ALL_VIEWS.map(v => [v, null])) as Record<ViewId, HTMLCanvasElement | null>
  );
  const cameras = useRef(initCameras());
  const panRef = useRef({ on: false, view: null as ViewId | null, sx: 0, sy: 0, spx: 0, spy: 0 });

  // --- Coordinate transforms ---
  const localToScreen = useCallback((p: Point, v: ViewId, cw: number, ch: number): Point => {
    const cam = cameras.current[v];
    return { x: cw / 2 + cam.panX + p.x * cam.zoom, y: ch / 2 + cam.panY - p.y * cam.zoom };
  }, []);

  const screenToLocal = useCallback((sx: number, sy: number, v: ViewId, cw: number, ch: number): Point => {
    const cam = cameras.current[v];
    return { x: (sx - cw / 2 - cam.panX) / cam.zoom, y: -(sy - ch / 2 - cam.panY) / cam.zoom };
  }, []);

  const w2s = useCallback((p3: Point3D, v: ViewId, cw: number, ch: number): Point => {
    return localToScreen(V[v].to2D(p3), v, cw, ch);
  }, [localToScreen]);

  const getPoint = useCallback((cv: HTMLCanvasElement, v: ViewId, cx: number, cy: number): Point => {
    const r = cv.getBoundingClientRect();
    const sx = (cx - r.left) * (cv.width / r.width);
    const sy = (cy - r.top) * (cv.height / r.height);
    return snap(screenToLocal(sx, sy, v, cv.width, cv.height), GRID_SIZE);
  }, [screenToLocal]);

  // --- Render ---
  const draw = useCallback((v: ViewId) => {
    const c = canvases.current[v];
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width, H = c.height;
    const cam = cameras.current[v];
    const z = cam.zoom;
    const ox = W / 2 + cam.panX, oy = H / 2 + cam.panY;
    const ts = (p3: Point3D) => w2s(p3, v, W, H);
    const tl = (p: Point) => localToScreen(p, v, W, H);

    // background
    ctx.fillStyle = BG_PANEL; ctx.fillRect(0, 0, W, H);

    // grid
    const gs = GRID_SIZE * z;
    if (gs > 3) {
      ctx.lineWidth = 1;
      for (let x = ((ox % gs) + gs) % gs; x < W; x += gs) {
        const wc = Math.round((x - ox) / z);
        ctx.strokeStyle = wc % (GRID_SIZE * 5) === 0 ? GRID_MAJOR : GRID_COLOR;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = ((oy % gs) + gs) % gs; y < H; y += gs) {
        const wc = Math.round((y - oy) / z);
        ctx.strokeStyle = wc % (GRID_SIZE * 5) === 0 ? GRID_MAJOR : GRID_COLOR;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    // origin axes
    ctx.strokeStyle = "#1d2d58"; ctx.lineWidth = 1;
    if (ox > 0 && ox < W) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke(); }
    if (oy > 0 && oy < H) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke(); }

    // labels (screen-fixed)
    ctx.fillStyle = "rgba(170,180,200,0.5)";
    ctx.font = "italic bold 13px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(V[v].name, 10, 20);
    ctx.font = "italic 11px system-ui, sans-serif"; ctx.fillStyle = "rgba(130,145,175,0.4)";
    ctx.fillText(`${V[v].axes[0]} \u2192`, 10, 36);
    ctx.fillText(`${V[v].axes[1]} \u2191`, 10, 50);
    ctx.fillStyle = "rgba(100,115,155,0.3)"; ctx.font = "italic 10px system-ui, sans-serif";
    ctx.textAlign = "right"; ctx.fillText(`${Math.round(z * 100)}%`, W - 8, 18); ctx.textAlign = "left";

    // --- draw elements ---
    for (const el of elements) {
      const isSrc = el.sourceView === v;
      const lc = isSrc ? LINE_COLOR : GHOST_LINE;
      const cc = isSrc ? CENTERLINE_COLOR : GHOST_CENTER;
      const lw = isSrc ? 1.5 : 0.8;

      ctx.save();
      if (!isSrc) ctx.globalAlpha = 0.5;

      if (el.type === "line") {
        const a = ts(el.points3D[0]), b = ts(el.points3D[1]);
        ctx.strokeStyle = lc; ctx.lineWidth = lw; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (isSrc) {
          const d = dist3(el.points3D[0], el.points3D[1]);
          if (d > 10) {
            ctx.globalAlpha = 1;
            const hz = Math.abs(b.y - a.y) < Math.abs(b.x - a.x);
            drawDimLine(ctx, a, b, hz ? -20 : 20, hz, d);
          }
        }
      }

      if (el.type === "rect") {
        const corners = rectCorners(el, V[v], ts);
        ctx.strokeStyle = lc; ctx.lineWidth = lw; ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath(); ctx.stroke();

        if (el.hatch && isSrc) drawHatch(ctx, corners);

        if (isSrc) {
          const src = V[el.sourceView];
          const l0 = src.to2D(el.points3D[0]), l1 = src.to2D(el.points3D[1]);
          const dw = Math.abs(l1.x - l0.x), dh = Math.abs(l1.y - l0.y);
          if (dw > 10 && dh > 10) {
            ctx.globalAlpha = 1;
            const xs = corners.map(c => c.x), ys = corners.map(c => c.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            drawDimLine(ctx, { x: minX, y: minY }, { x: maxX, y: minY }, -18, true, dw);
            drawDimLine(ctx, { x: maxX, y: minY }, { x: maxX, y: maxY }, 18, false, dh);
          }
        }
      }

      if (el.type === "circle") {
        const pts = circleScreenPts(el, ts);
        ctx.strokeStyle = lc; ctx.lineWidth = lw; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        if (isSrc) {
          const sc = ts(el.points3D[0]);
          const r = dist3(el.points3D[0], el.points3D[1]) * z;
          drawCL(ctx, sc.x - r - 8, sc.y, sc.x + r + 8, sc.y);
          drawCL(ctx, sc.x, sc.y - r - 8, sc.x, sc.y + r + 8);
          ctx.globalAlpha = 1;
          ctx.save();
          ctx.fillStyle = DIM_COLOR;
          ctx.font = "italic bold 11px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
          const diam = Math.round(dist3(el.points3D[0], el.points3D[1]) * 2);
          const lbl = `\u00D8${diam}`;
          const tw = ctx.measureText(lbl).width;
          ctx.fillStyle = BG_PANEL; ctx.fillRect(sc.x + r + 8, sc.y - 8, tw + 8, 16);
          ctx.fillStyle = DIM_COLOR; ctx.fillText(lbl, sc.x + r + 12, sc.y);
          ctx.restore();
        } else {
          // ghost center cross
          const sc = ts(el.points3D[0]);
          const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
          const spanX = Math.max(...xs) - Math.min(...xs);
          const spanY = Math.max(...ys) - Math.min(...ys);
          if (spanX > 4) drawCL(ctx, Math.min(...xs) - 4, sc.y, Math.max(...xs) + 4, sc.y, cc);
          if (spanY > 4) drawCL(ctx, sc.x, Math.min(...ys) - 4, sc.x, Math.max(...ys) + 4, cc);
        }
      }

      if (el.type === "centerline") {
        const a = ts(el.points3D[0]), b = ts(el.points3D[1]);
        drawCL(ctx, a.x, a.y, b.x, b.y, cc);
      }

      ctx.restore();
    }

    // --- preview (in-progress) ---
    if (drawing && drawPts.length > 0) {
      // Show preview in ALL views (source = bright, others = ghost)
      const isSrc = active === v;
      const pc = isSrc ? PREVIEW_COLOR : GHOST_LINE;
      const pw = isSrc ? 1.5 : 0.8;
      const pa = isSrc ? 1 : 0.35;

      const srcProj = V[active];
      const p0_3d = srcProj.to3D(drawPts[0].x, drawPts[0].y);
      const p1_3d = drawPts[1] ? srcProj.to3D(drawPts[1].x, drawPts[1].y) : p0_3d;
      const a = ts(p0_3d), b = ts(p1_3d);

      ctx.save();
      ctx.globalAlpha = pa;

      if (tool === "line") {
        ctx.strokeStyle = pc; ctx.lineWidth = pw; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (drawPts[1] && isSrc) {
          const d = dist3(p0_3d, p1_3d);
          if (d > 10) {
            ctx.globalAlpha = 1;
            const hz = Math.abs(b.y - a.y) < Math.abs(b.x - a.x);
            drawDimLine(ctx, a, b, hz ? -20 : 20, hz, d, pc);
          }
        }
      }

      if (tool === "rect" && drawPts[1]) {
        const l0 = drawPts[0], l1 = drawPts[1];
        const c0 = p0_3d;
        const c1 = srcProj.to3D(l1.x, l0.y);
        const c2 = p1_3d;
        const c3 = srcProj.to3D(l0.x, l1.y);
        const s = [ts(c0), ts(c1), ts(c2), ts(c3)];
        ctx.strokeStyle = pc; ctx.lineWidth = pw; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(s[i].x, s[i].y);
        ctx.closePath(); ctx.stroke();
        if (isSrc) {
          const dw = Math.abs(l1.x - l0.x), dh = Math.abs(l1.y - l0.y);
          if (dw > 10 && dh > 10) {
            ctx.globalAlpha = 1;
            const xs2 = s.map(p => p.x), ys2 = s.map(p => p.y);
            const mnX = Math.min(...xs2), mxX = Math.max(...xs2);
            const mnY = Math.min(...ys2), mxY = Math.max(...ys2);
            drawDimLine(ctx, { x: mnX, y: mnY }, { x: mxX, y: mnY }, -18, true, dw, pc);
            drawDimLine(ctx, { x: mxX, y: mnY }, { x: mxX, y: mxY }, 18, false, dh, pc);
          }
        }
      } else if (tool === "rect") {
        // single point, nothing to draw yet
      }

      if (tool === "circle" && drawPts[1]) {
        const r3 = dist3(p0_3d, p1_3d);
        const hDir = srcProj.to3D(1, 0), vDir = srcProj.to3D(0, 1);
        const pts: Point[] = [];
        for (let i = 0; i <= CIRCLE_SAMPLES; i++) {
          const ang = (i / CIRCLE_SAMPLES) * Math.PI * 2;
          const co = Math.cos(ang), si = Math.sin(ang);
          pts.push(ts({
            x: p0_3d.x + r3 * (co * hDir.x + si * vDir.x),
            y: p0_3d.y + r3 * (co * hDir.y + si * vDir.y),
            z: p0_3d.z + r3 * (co * hDir.z + si * vDir.z),
          }));
        }
        ctx.strokeStyle = pc; ctx.lineWidth = pw; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        if (isSrc && r3 > 5) {
          const sc = a;
          const sr = r3 * z;
          drawCL(ctx, sc.x - sr - 8, sc.y, sc.x + sr + 8, sc.y);
          drawCL(ctx, sc.x, sc.y - sr - 8, sc.x, sc.y + sr + 8);
          ctx.globalAlpha = 1;
          ctx.fillStyle = pc; ctx.font = "italic bold 11px system-ui, sans-serif";
          ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText(`\u00D8${Math.round(r3 * 2)}`, sc.x + sr + 12, sc.y);
        }
      }

      if (tool === "centerline") {
        drawCL(ctx, a.x, a.y, b.x, b.y, isSrc ? PREVIEW_COLOR : GHOST_CENTER);
      }

      ctx.restore();
    }
  }, [elements, drawing, drawPts, tool, active, w2s, localToScreen]);

  // --- Resize ---
  useEffect(() => {
    const fn = () => {
      ALL_VIEWS.forEach(v => {
        const c = canvases.current[v]; if (!c) return;
        const p = c.parentElement; if (!p) return;
        const r = p.getBoundingClientRect();
        const nw = Math.floor(r.width), nh = Math.floor(r.height);
        if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; }
      });
      ALL_VIEWS.forEach(draw);
    };
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [draw]);

  useEffect(() => { ALL_VIEWS.forEach(draw); }, [elements, drawing, drawPts, draw]);

  // --- Wheel zoom ---
  useEffect(() => {
    const hs: Array<{ el: HTMLCanvasElement; fn: (e: WheelEvent) => void }> = [];
    ALL_VIEWS.forEach(v => {
      const c = canvases.current[v]; if (!c) return;
      const fn = (e: WheelEvent) => {
        e.preventDefault();
        const cam = cameras.current[v];
        const r = c.getBoundingClientRect();
        const sx = (e.clientX - r.left) * (c.width / r.width);
        const sy = (e.clientY - r.top) * (c.height / r.height);
        const oldZ = cam.zoom;
        const newZ = clamp(oldZ * (1 - e.deltaY * ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
        const cx = c.width / 2, cy = c.height / 2;
        const wx = (sx - cx - cam.panX) / oldZ;
        const wy = (sy - cy - cam.panY) / oldZ;
        cam.zoom = newZ;
        cam.panX = sx - cx - wx * newZ;
        cam.panY = sy - cy - wy * newZ;
        ALL_VIEWS.forEach(draw);
        bump(n => n + 1);
      };
      c.addEventListener("wheel", fn, { passive: false });
      hs.push({ el: c, fn });
    });
    return () => { hs.forEach(({ el, fn }) => el.removeEventListener("wheel", fn)); };
  }, [draw]);

  // --- Mouse handlers ---
  const onDown = useCallback((v: ViewId, e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      const cam = cameras.current[v];
      panRef.current = { on: true, view: v, sx: e.clientX, sy: e.clientY, spx: cam.panX, spy: cam.panY };
      setActive(v);
      return;
    }
    if (e.button !== 0) return;
    const c = canvases.current[v]; if (!c) return;
    setActive(v);
    setDrawing(true);
    setDrawPts([getPoint(c, v, e.clientX, e.clientY)]);
  }, [getPoint]);

  const onMove = useCallback((v: ViewId, e: React.MouseEvent) => {
    if (panRef.current.on && panRef.current.view === v) {
      const c = canvases.current[v]; if (!c) return;
      const r = c.getBoundingClientRect();
      const scX = c.width / r.width, scY = c.height / r.height;
      const cam = cameras.current[v];
      cam.panX = panRef.current.spx + (e.clientX - panRef.current.sx) * scX;
      cam.panY = panRef.current.spy + (e.clientY - panRef.current.sy) * scY;
      ALL_VIEWS.forEach(draw);
      return;
    }
    if (!drawing || v !== active) return;
    const c = canvases.current[v]; if (!c) return;
    setDrawPts(prev => [prev[0], getPoint(c, v, e.clientX, e.clientY)]);
  }, [drawing, active, getPoint, draw]);

  const onUp = useCallback((v: ViewId, e: React.MouseEvent) => {
    if (panRef.current.on && (e.button === 1 || e.button === 2)) {
      panRef.current.on = false; panRef.current.view = null; return;
    }
    if (!drawing || drawPts.length < 2) { setDrawing(false); setDrawPts([]); return; }
    const proj = V[active];
    const el: Element = {
      id: Math.random().toString(36).slice(2),
      type: tool,
      points3D: [proj.to3D(drawPts[0].x, drawPts[0].y), proj.to3D(drawPts[1].x, drawPts[1].y)],
      sourceView: active,
    };
    if (tool === "rect" && hatchMode) el.hatch = true;
    setElements(prev => [...prev, el]);
    setDrawing(false); setDrawPts([]);
  }, [drawing, drawPts, active, tool, hatchMode]);

  const onLeave = useCallback((v: ViewId) => {
    if (panRef.current.on && panRef.current.view === v) { panRef.current.on = false; panRef.current.view = null; }
    if (drawing) { setDrawing(false); setDrawPts([]); }
  }, [drawing]);

  const undo = useCallback(() => {
    setElements(prev => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].sourceView === active) return [...prev.slice(0, i), ...prev.slice(i + 1)];
      }
      return prev;
    });
  }, [active]);

  const clear = useCallback(() => { setElements([]); }, []);

  const resetView = useCallback(() => {
    cameras.current[active] = { panX: 0, panY: 0, zoom: 1 };
    ALL_VIEWS.forEach(draw); bump(n => n + 1);
  }, [active, draw]);

  const toolDefs: { id: ToolId; label: string; icon: string }[] = [
    { id: "line", label: "Line", icon: "\u2571" },
    { id: "rect", label: "Rect", icon: "\u25AD" },
    { id: "circle", label: "Circle", icon: "\u25CB" },
    { id: "centerline", label: "Center", icon: "\u2508" },
  ];

  const cam = cameras.current[active];
  const srcCount = elements.filter(e => e.sourceView === active).length;

  const vc = (v: ViewId) => (
    <div key={v} className="relative overflow-hidden">
      <canvas ref={el => { if (el) canvases.current[v] = el; }} className="w-full h-full block" style={{ cursor: "crosshair", outline: "none" }}
        onMouseDown={e => onDown(v, e)} onMouseMove={e => onMove(v, e)} onMouseUp={e => onUp(v, e)} onMouseLeave={() => onLeave(v)} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden select-none" style={{ backgroundColor: BG, backgroundImage: BG_CONTAINER, backgroundSize: "20px 20px", backgroundPosition: "0 0", fontFamily: "system-ui, sans-serif" }} onContextMenu={e => e.preventDefault()}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ background: "#0d1428", borderBottom: "1px solid #223050" }}>
        <div className="flex items-center gap-2 pr-4" style={{ borderRight: "1px solid #223050" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2d5899" }}>
            <span className="text-white text-xs font-bold">BP</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#7382a0" }}>Blueprint Sketcher</span>
        </div>
        <div className="flex items-center gap-1">
          {toolDefs.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} className="px-3 py-1.5 text-xs font-bold rounded transition-colors"
              style={{ background: tool === t.id ? "#2d5899" : "transparent", color: tool === t.id ? "#fff" : "#5a6a8a", border: `1px solid ${tool === t.id ? "#3d6a9e" : "#223050"}` }}>
              <span className="mr-1">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
<div className="flex items-center gap-1 ml-2 pl-2" style={{ borderLeft: "1px solid #223050" }}>
            <button
              onClick={() => setHatchMode(!hatchMode)}
              style={{ background: hatchMode ? "#553311" : "transparent", color: hatchMode ? "#eecc77" : "#5a6a8a", border: `1px solid ${hatchMode ? "#774422" : "#223050"}` }}>
            <span className="mr-1">{"\u2572"}</span>Hatch
          </button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={resetView} className="px-3 py-1.5 text-xs font-bold rounded transition-colors"
style={{ background: "transparent", color: "#5a6a8a", border: "1px solid #223050" }}>Reset View</button>
            <button onClick={undo} className="px-2 py-1 rounded text-xs font-medium"
              style={{ background: "transparent", color: "#5a6a8a", border: "1px solid #223050" }}>Undo</button>
            <button onClick={() => { setElements([]); setUndoStack([]); }} className="px-2 py-1 rounded text-xs font-medium"
              style={{ background: "transparent", color: "#994444", border: "1px solid #442222" }}>Clear All</button>
        </div>
      </div>

      {/* Canvas grid — cross layout matching standard 3rd-angle projection */}
      <div className="flex-1">
        <div className="h-full grid gap-[0px]" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr" }}>
          {/* Row 1: empty | TOP | empty | empty */}
          <div />
          {vc("top")}
          <div />
          <div />
          {/* Row 2: LEFT | FRONT | RIGHT | BACK */}
          {vc("left")}
          {vc("front")}
          {vc("right")}
          {vc("back")}
          {/* Row 3: empty | BOTTOM | empty | empty */}
          <div />
          {vc("bottom")}
          <div />
          <div />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center px-4 py-1 text-xs shrink-0" style={{ background: "#0d1428", borderTop: "1px solid #223050", color: "#445566" }}>
        <span>View: <strong style={{ color: "#7382a0" }}>{V[active].name}</strong></span>
        <span className="mx-3">|</span>
        <span>Tool: <strong style={{ color: "#7382a0" }}>{tool}</strong></span>
        <span className="mx-3">|</span>
        <span>Zoom: <strong style={{ color: "#7382a0" }}>{Math.round(cam.zoom * 100)}%</strong></span>
        {hatchMode && <><span className="mx-3">|</span><span style={{ color: "#eecc77" }}>Hatch ON</span></>}
        <span className="ml-auto" style={{ color: "#2d3a50" }}>Scroll: zoom | Mid/Right drag: pan</span>
      </div>
    </div>
  );
}
