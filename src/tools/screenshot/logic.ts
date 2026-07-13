import { PALETTE } from '@/lib/palette';

export type ShapeKind =
  | 'rect'
  | 'ellipse'
  | 'freeform'
  | 'arrow'
  | 'line'
  | 'curve'
  | 'highlight'
  | 'marker'
  | 'pen'
  | 'text'
  | 'blur'
  | 'stepNumber'
  | 'emoji';

export interface BaseShape {
  id: string;
  kind: ShapeKind;
  color: string;
  strokeWidth: number;
}

export interface RectShape extends BaseShape {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EllipseShape extends BaseShape {
  kind: 'ellipse';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FreeformShape extends BaseShape {
  kind: 'freeform';
  points: { x: number; y: number }[];
}

export interface HighlightShape extends BaseShape {
  kind: 'highlight';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArrowShape extends BaseShape {
  kind: 'arrow';
  /** Defaults to 'single' when absent (legacy shapes predate this field). */
  variant?: 'single' | 'double';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineShape extends BaseShape {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CurveShape extends BaseShape {
  kind: 'curve';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Quadratic Bézier control point, draggable in the UI. */
  cx: number;
  cy: number;
}

export interface MarkerShape extends BaseShape {
  kind: 'marker';
  points: { x: number; y: number }[];
}

export type TextFontFamily = 'sans' | 'serif' | 'mono';

export interface TextShape extends BaseShape {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  /** Wrap width in canvas px. If undefined → render as single line (legacy). */
  width?: number;
  fontFamily?: TextFontFamily;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface PenShape extends BaseShape {
  kind: 'pen';
  points: { x: number; y: number }[];
}

export interface BlurShape extends BaseShape {
  kind: 'blur';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pixelation block size in canvas px. */
  intensity: number;
}

export interface StepNumberShape extends BaseShape {
  kind: 'stepNumber';
  /** Center point. */
  x: number;
  y: number;
  /** Circle diameter in canvas px. */
  size: number;
}

export interface EmojiShape extends BaseShape {
  kind: 'emoji';
  /** Top-left anchor, like TextShape. */
  x: number;
  y: number;
  char: string;
  size: number;
}

export type Shape =
  | RectShape
  | EllipseShape
  | FreeformShape
  | HighlightShape
  | ArrowShape
  | LineShape
  | CurveShape
  | MarkerShape
  | TextShape
  | PenShape
  | BlurShape
  | StepNumberShape
  | EmojiShape;

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScreenshotCaptureResponse {
  ok: boolean;
  dataUrl?: string;
  error?: string;
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/** Font stacks offered for the Text tool — system fonts only (offline extension,
 * no bundled webfonts), chosen to cover Cyrillic + Latin across all 6 supported locales. */
export const FONT_STACKS: readonly { id: TextFontFamily; css: string }[] = [
  { id: 'sans', css: `ui-sans-serif, system-ui, sans-serif` },
  { id: 'serif', css: `Georgia, 'Times New Roman', serif` },
  { id: 'mono', css: `'Courier New', ui-monospace, monospace` },
];

export function resolveFontStack(id: TextFontFamily | undefined): string {
  return FONT_STACKS.find((f) => f.id === id)?.css ?? FONT_STACKS[0].css;
}

/** Returns the ids of all `stepNumber` shapes in array order — index+1 is the
 * displayed label. Recomputed at render/draw time so undo/delete renumbers for free. */
export function stepShapeIds(shapes: Shape[]): string[] {
  return shapes.filter((s): s is StepNumberShape => s.kind === 'stepNumber').map((s) => s.id);
}

export function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]): void {
  const stepOrder = stepShapeIds(shapes);
  for (const shape of shapes) {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    switch (shape.kind) {
      case 'rect':
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        break;
      case 'ellipse': {
        const cx = shape.x + shape.w / 2;
        const cy = shape.y + shape.h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(shape.w) / 2, Math.abs(shape.h) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'freeform': {
        if (shape.points.length === 0) break;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++)
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        ctx.closePath();
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'highlight':
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        ctx.restore();
        break;
      case 'marker': {
        if (shape.points.length === 0) break;
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++)
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'arrow':
        drawArrow(ctx, shape);
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
        break;
      case 'curve':
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.quadraticCurveTo(shape.cx, shape.cy, shape.x2, shape.y2);
        ctx.stroke();
        break;
      case 'pen':
        if (shape.points.length === 0) break;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
        break;
      case 'blur': {
        const x = Math.min(shape.x, shape.x + shape.w);
        const y = Math.min(shape.y, shape.y + shape.h);
        const w = Math.abs(shape.w);
        const h = Math.abs(shape.h);
        drawPixelation(ctx, x, y, w, h, shape.intensity);
        break;
      }
      case 'stepNumber': {
        const label = String(stepOrder.indexOf(shape.id) + 1);
        const r = shape.size / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, r, 0, Math.PI * 2);
        ctx.fillStyle = shape.color;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, shape.size * 0.5)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, shape.x, shape.y + 1);
        ctx.restore();
        break;
      }
      case 'emoji': {
        ctx.save();
        ctx.font = `${shape.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(shape.char, shape.x, shape.y);
        ctx.restore();
        break;
      }
      case 'text': {
        const weight = shape.bold ? 'bold ' : '';
        const style = shape.italic ? 'italic ' : '';
        ctx.font = `${style}${weight}${shape.fontSize}px ${resolveFontStack(shape.fontFamily)}`;
        ctx.textBaseline = 'top';
        const lineHeight = shape.fontSize * 1.25;
        const lines = shape.width ? wrapText(ctx, shape.text, shape.width) : shape.text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const lineY = shape.y + i * lineHeight;
          ctx.fillText(lines[i], shape.x, lineY);
          if (shape.underline && lines[i]) {
            const w = ctx.measureText(lines[i]).width;
            const underlineY = lineY + shape.fontSize * 1.05;
            ctx.fillRect(shape.x, underlineY, w, Math.max(1, shape.fontSize * 0.06));
          }
        }
        break;
      }
    }
  }
}

/**
 * Greedy word-wrap: splits the text into lines that fit `maxWidth` in the
 * current canvas font. Honours explicit `\n` as hard breaks. A single word
 * longer than the limit is emitted on its own line (no character-level
 * splitting — keeps the implementation simple and predictable).
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (para === '') {
      out.push('');
      continue;
    }
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (!line || ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out.length === 0 ? [''] : out;
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  strokeWidth: number,
): void {
  const headLen = Math.max(10, strokeWidth * 4);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawArrow(ctx: CanvasRenderingContext2D, a: ArrowShape): void {
  ctx.beginPath();
  ctx.moveTo(a.x1, a.y1);
  ctx.lineTo(a.x2, a.y2);
  ctx.stroke();
  drawArrowhead(ctx, a.x1, a.y1, a.x2, a.y2, a.strokeWidth);
  if (a.variant === 'double') {
    drawArrowhead(ctx, a.x2, a.y2, a.x1, a.y1, a.strokeWidth);
  }
}

/** Downscale-then-upscale pixelation — cheap and GPU-backed, unlike a manual
 * per-pixel loop, which matters because the whole canvas redraws on every
 * state change (every mousemove while drawing something else). */
function drawPixelation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  blockSize: number,
): void {
  if (w <= 0 || h <= 0) return;
  const { rw, rh } = pixelationGridSize(w, h, blockSize);
  const off = document.createElement('canvas');
  off.width = rw;
  off.height = rh;
  const offCtx = off.getContext('2d');
  if (!offCtx) return;
  offCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, rw, rh);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, rw, rh, x, y, w, h);
  ctx.restore();
}

export function pixelationGridSize(
  w: number,
  h: number,
  blockSize: number,
): { rw: number; rh: number } {
  const b = Math.max(1, blockSize);
  return {
    rw: Math.max(1, Math.round(w / b)),
    rh: Math.max(1, Math.round(h / b)),
  };
}

export function exportPng(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export async function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode PNG'));
    }, 'image/png');
  });
}

export function downloadPng(canvas: HTMLCanvasElement, filename = 'screenshot.png'): void {
  const a = document.createElement('a');
  a.href = exportPng(canvas);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export { PALETTE };

export function isPointInRect(px: number, py: number, r: RectShape): boolean {
  const x = Math.min(r.x, r.x + r.w);
  const y = Math.min(r.y, r.y + r.h);
  const w = Math.abs(r.w);
  const h = Math.abs(r.h);
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

/** Normalise a possibly-flipped rectangle into positive width/height form. */
export function normaliseRect(rect: CropRect): CropRect {
  return {
    x: Math.min(rect.x, rect.x + rect.w),
    y: Math.min(rect.y, rect.y + rect.h),
    w: Math.abs(rect.w),
    h: Math.abs(rect.h),
  };
}

interface BBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function pointsBBox(points: { x: number; y: number }[]): BBox {
  if (points.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };
  let left = points[0].x;
  let right = points[0].x;
  let top = points[0].y;
  let bottom = points[0].y;
  for (const p of points) {
    if (p.x < left) left = p.x;
    if (p.x > right) right = p.x;
    if (p.y < top) top = p.y;
    if (p.y > bottom) bottom = p.y;
  }
  return { left, top, right, bottom };
}

/** Samples a quadratic Bézier curve into `steps + 1` points, endpoints inclusive. */
export function sampleQuadratic(shape: CurveShape, steps = 20): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * shape.x1 + 2 * mt * t * shape.cx + t * t * shape.x2;
    const y = mt * mt * shape.y1 + 2 * mt * t * shape.cy + t * t * shape.y2;
    pts.push({ x, y });
  }
  return pts;
}

export function shapeBBox(shape: Shape): BBox {
  switch (shape.kind) {
    case 'rect':
    case 'highlight':
    case 'ellipse':
    case 'blur': {
      const left = Math.min(shape.x, shape.x + shape.w);
      const right = Math.max(shape.x, shape.x + shape.w);
      const top = Math.min(shape.y, shape.y + shape.h);
      const bottom = Math.max(shape.y, shape.y + shape.h);
      return { left, top, right, bottom };
    }
    case 'arrow':
    case 'line':
      return {
        left: Math.min(shape.x1, shape.x2),
        right: Math.max(shape.x1, shape.x2),
        top: Math.min(shape.y1, shape.y2),
        bottom: Math.max(shape.y1, shape.y2),
      };
    case 'curve':
      return pointsBBox(sampleQuadratic(shape));
    case 'text': {
      const lineHeight = shape.fontSize * 1.25;
      if (shape.width) {
        // Estimate line count without a 2D context: roughly ceil(text * charWidth / width)
        // per paragraph, plus blank lines for explicit newlines. Used for hit testing
        // and crop overlap — exact pixel accuracy isn't required.
        const avgCharW = shape.fontSize * 0.55;
        let lines = 0;
        for (const para of shape.text.split('\n')) {
          if (para === '') {
            lines += 1;
            continue;
          }
          const est = Math.max(1, Math.ceil((para.length * avgCharW) / shape.width));
          lines += est;
        }
        return {
          left: shape.x,
          top: shape.y,
          right: shape.x + shape.width,
          bottom: shape.y + Math.max(1, lines) * lineHeight,
        };
      }
      const width = shape.text.length * shape.fontSize * 0.6;
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x + width,
        bottom: shape.y + shape.fontSize,
      };
    }
    case 'pen':
    case 'marker':
    case 'freeform':
      return pointsBBox(shape.points);
    case 'stepNumber': {
      const r = shape.size / 2;
      return { left: shape.x - r, top: shape.y - r, right: shape.x + r, bottom: shape.y + r };
    }
    case 'emoji':
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x + shape.size,
        bottom: shape.y + shape.size,
      };
  }
}

/** Returns true when the bbox has any overlap with [0..w] × [0..h]. */
function intersects(bbox: BBox, w: number, h: number): boolean {
  return !(bbox.right < 0 || bbox.left > w || bbox.bottom < 0 || bbox.top > h);
}

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.kind) {
    case 'rect':
    case 'highlight':
    case 'ellipse':
    case 'blur':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'arrow':
    case 'line':
      return {
        ...shape,
        x1: shape.x1 + dx,
        y1: shape.y1 + dy,
        x2: shape.x2 + dx,
        y2: shape.y2 + dy,
      };
    case 'curve':
      return {
        ...shape,
        x1: shape.x1 + dx,
        y1: shape.y1 + dy,
        x2: shape.x2 + dx,
        y2: shape.y2 + dy,
        cx: shape.cx + dx,
        cy: shape.cy + dy,
      };
    case 'text':
    case 'stepNumber':
    case 'emoji':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'pen':
    case 'marker':
    case 'freeform':
      return {
        ...shape,
        points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
  }
}

/** Distance from a point to a line segment. */
function distancePointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Point-in-polygon test via ray casting. */
export function pointInPolygon(
  px: number,
  py: number,
  points: { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Returns true if (px, py) is "on" the shape within `tolerance` canvas px. */
export function hitTestShape(shape: Shape, px: number, py: number, tolerance = 8): boolean {
  switch (shape.kind) {
    case 'highlight':
    case 'text':
    case 'ellipse':
    case 'blur':
    case 'emoji': {
      const b = shapeBBox(shape);
      return (
        px >= b.left - tolerance &&
        px <= b.right + tolerance &&
        py >= b.top - tolerance &&
        py <= b.bottom + tolerance
      );
    }
    case 'rect': {
      // Outline only: near any of the 4 edges
      const x = Math.min(shape.x, shape.x + shape.w);
      const y = Math.min(shape.y, shape.y + shape.h);
      const w = Math.abs(shape.w);
      const h = Math.abs(shape.h);
      const t = Math.max(tolerance, shape.strokeWidth);
      const onLeft = Math.abs(px - x) <= t && py >= y - t && py <= y + h + t;
      const onRight = Math.abs(px - (x + w)) <= t && py >= y - t && py <= y + h + t;
      const onTop = Math.abs(py - y) <= t && px >= x - t && px <= x + w + t;
      const onBottom = Math.abs(py - (y + h)) <= t && px >= x - t && px <= x + w + t;
      return onLeft || onRight || onTop || onBottom;
    }
    case 'arrow':
    case 'line': {
      const t = Math.max(tolerance, shape.strokeWidth);
      return distancePointToSegment(px, py, shape.x1, shape.y1, shape.x2, shape.y2) <= t;
    }
    case 'curve': {
      const t = Math.max(tolerance, shape.strokeWidth);
      const pts = sampleQuadratic(shape);
      for (let i = 1; i < pts.length; i++) {
        if (distancePointToSegment(px, py, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= t)
          return true;
      }
      return false;
    }
    case 'pen':
    case 'marker': {
      const t = Math.max(tolerance, shape.strokeWidth);
      for (let i = 1; i < shape.points.length; i++) {
        const a = shape.points[i - 1];
        const b = shape.points[i];
        if (distancePointToSegment(px, py, a.x, a.y, b.x, b.y) <= t) return true;
      }
      return false;
    }
    case 'freeform': {
      if (pointInPolygon(px, py, shape.points)) return true;
      const t = Math.max(tolerance, shape.strokeWidth);
      const pts = shape.points;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if (distancePointToSegment(px, py, a.x, a.y, b.x, b.y) <= t) return true;
      }
      return false;
    }
    case 'stepNumber': {
      const r = shape.size / 2 + tolerance;
      return Math.hypot(px - shape.x, py - shape.y) <= r;
    }
  }
}

/** Finds the topmost shape (last-drawn) under the point. */
export function findShapeAt(shapes: Shape[], px: number, py: number, tolerance = 8): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (hitTestShape(shapes[i], px, py, tolerance)) return shapes[i];
  }
  return null;
}

/**
 * Shift every shape so the new origin matches the crop, and drop shapes
 * whose bounding box has no overlap with the cropped region.
 */
export function translateShapesForCrop(shapes: Shape[], crop: CropRect): Shape[] {
  const c = normaliseRect(crop);
  const out: Shape[] = [];
  for (const shape of shapes) {
    const translated = translateShape(shape, -c.x, -c.y);
    if (intersects(shapeBBox(translated), c.w, c.h)) out.push(translated);
  }
  return out;
}

/**
 * Returns a data URL containing the source canvas cropped to `crop`.
 * Crop is normalised first so flipped selections behave the same.
 */
export function cropImage(source: HTMLCanvasElement, crop: CropRect): string {
  const c = normaliseRect(crop);
  const w = Math.max(1, Math.round(c.w));
  const h = Math.max(1, Math.round(c.h));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to acquire 2D context');
  ctx.drawImage(source, c.x, c.y, c.w, c.h, 0, 0, w, h);
  return out.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// History: undo / redo / reset
// ---------------------------------------------------------------------------

export interface EditorSnapshot {
  imgUrl: string;
  shapes: Shape[];
}

export interface HistoryState {
  /** entries[0] is always the original captured screenshot with no shapes. */
  entries: EditorSnapshot[];
  index: number;
}

export function initHistory(imgUrl: string): HistoryState {
  return { entries: [{ imgUrl, shapes: [] }], index: 0 };
}

export function currentSnapshot(h: HistoryState): EditorSnapshot {
  return h.entries[h.index];
}

/** Pushes a new snapshot, truncating any redo branch. Evicts the oldest
 * non-original entry once `maxEntries` is exceeded — entries[0] is never evicted. */
export function pushHistory(h: HistoryState, next: EditorSnapshot, maxEntries = 50): HistoryState {
  const truncated = h.entries.slice(0, h.index + 1);
  let entries = [...truncated, next];
  let index = entries.length - 1;
  if (entries.length > maxEntries) {
    entries = [entries[0], ...entries.slice(2)];
    index -= 1;
  }
  return { entries, index };
}

export function undoHistory(h: HistoryState): HistoryState {
  return { ...h, index: Math.max(0, h.index - 1) };
}

export function redoHistory(h: HistoryState): HistoryState {
  return { ...h, index: Math.min(h.entries.length - 1, h.index + 1) };
}

/** Jumps back to the original capture without discarding forward (redo) history. */
export function resetHistory(h: HistoryState): HistoryState {
  return { ...h, index: 0 };
}

export function canUndo(h: HistoryState): boolean {
  return h.index > 0;
}

export function canRedo(h: HistoryState): boolean {
  return h.index < h.entries.length - 1;
}

// ---------------------------------------------------------------------------
// Floating overlay positioning (crop Apply/Cancel buttons)
// ---------------------------------------------------------------------------

/** Clamps a desired top-left position so a `size`-sized box stays within `bounds`. */
export function clampFloatingPosition(
  desired: { left: number; top: number },
  size: { w: number; h: number },
  bounds: { w: number; h: number },
): { left: number; top: number } {
  const left = Math.min(Math.max(0, desired.left), Math.max(0, bounds.w - size.w));
  const top = Math.min(Math.max(0, desired.top), Math.max(0, bounds.h - size.h));
  return { left, top };
}

/** Converts a canvas-pixel rect to a screen/CSS-pixel rect given the canvas's
 * intrinsic size and its displayed (possibly scaled) size — the inverse of the
 * canvas-coordinate conversion used for pointer events. */
export function canvasRectToScreenRect(
  rect: CropRect,
  canvasSize: { w: number; h: number },
  screenSize: { w: number; h: number },
): { left: number; top: number; width: number; height: number } {
  const scaleX = canvasSize.w === 0 ? 1 : screenSize.w / canvasSize.w;
  const scaleY = canvasSize.h === 0 ? 1 : screenSize.h / canvasSize.h;
  const n = normaliseRect(rect);
  return {
    left: n.x * scaleX,
    top: n.y * scaleY,
    width: n.w * scaleX,
    height: n.h * scaleY,
  };
}
