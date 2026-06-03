export type ShapeKind = 'rect' | 'arrow' | 'text' | 'highlight' | 'line' | 'pen';

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

export interface HighlightShape extends BaseShape {
  kind: 'highlight';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArrowShape extends BaseShape {
  kind: 'arrow';
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

export interface TextShape extends BaseShape {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export interface PenShape extends BaseShape {
  kind: 'pen';
  points: { x: number; y: number }[];
}

export type Shape = RectShape | HighlightShape | ArrowShape | LineShape | TextShape | PenShape;

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

export function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]): void {
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
      case 'highlight':
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        ctx.restore();
        break;
      case 'arrow':
        drawArrow(ctx, shape);
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
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
      case 'text': {
        ctx.font = `bold ${shape.fontSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(shape.text, shape.x, shape.y);
        break;
      }
    }
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, a: ArrowShape): void {
  const headLen = Math.max(10, a.strokeWidth * 4);
  const dx = a.x2 - a.x1;
  const dy = a.y2 - a.y1;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(a.x1, a.y1);
  ctx.lineTo(a.x2, a.y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(a.x2, a.y2);
  ctx.lineTo(
    a.x2 - headLen * Math.cos(angle - Math.PI / 6),
    a.y2 - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    a.x2 - headLen * Math.cos(angle + Math.PI / 6),
    a.y2 - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
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

export const PALETTE = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ffffff',
  '#000000',
];

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

export function shapeBBox(shape: Shape): BBox {
  switch (shape.kind) {
    case 'rect':
    case 'highlight': {
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
    case 'text': {
      const width = shape.text.length * shape.fontSize * 0.6;
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x + width,
        bottom: shape.y + shape.fontSize,
      };
    }
    case 'pen': {
      if (shape.points.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };
      let left = shape.points[0].x;
      let right = shape.points[0].x;
      let top = shape.points[0].y;
      let bottom = shape.points[0].y;
      for (const p of shape.points) {
        if (p.x < left) left = p.x;
        if (p.x > right) right = p.x;
        if (p.y < top) top = p.y;
        if (p.y > bottom) bottom = p.y;
      }
      return { left, top, right, bottom };
    }
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
    case 'text':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'pen':
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

/** Returns true if (px, py) is "on" the shape within `tolerance` canvas px. */
export function hitTestShape(shape: Shape, px: number, py: number, tolerance = 8): boolean {
  switch (shape.kind) {
    case 'highlight':
    case 'text': {
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
    case 'pen': {
      const t = Math.max(tolerance, shape.strokeWidth);
      for (let i = 1; i < shape.points.length; i++) {
        const a = shape.points[i - 1];
        const b = shape.points[i];
        if (distancePointToSegment(px, py, a.x, a.y, b.x, b.y) <= t) return true;
      }
      return false;
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
