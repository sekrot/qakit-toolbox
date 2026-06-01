export type ShapeKind = 'rect' | 'arrow' | 'text';

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

export interface ArrowShape extends BaseShape {
  kind: 'arrow';
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

export type Shape = RectShape | ArrowShape | TextShape;

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
      case 'arrow':
        drawArrow(ctx, shape);
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
