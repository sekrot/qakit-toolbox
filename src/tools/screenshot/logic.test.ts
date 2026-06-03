import { describe, expect, it, vi } from 'vitest';
import {
  drawShapes,
  isPointInRect,
  makeId,
  normaliseRect,
  PALETTE,
  shapeBBox,
  translateShapesForCrop,
  type RectShape,
  type Shape,
} from './logic';

describe('makeId', () => {
  it('returns a non-empty string', () => {
    const id = makeId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(5);
  });
  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => makeId()));
    expect(ids.size).toBe(50);
  });
});

describe('isPointInRect', () => {
  const rect: RectShape = {
    id: 'r',
    kind: 'rect',
    color: '#fff',
    strokeWidth: 2,
    x: 10,
    y: 20,
    w: 100,
    h: 50,
  };
  it('detects point inside', () => {
    expect(isPointInRect(50, 40, rect)).toBe(true);
  });
  it('handles edges', () => {
    expect(isPointInRect(10, 20, rect)).toBe(true);
    expect(isPointInRect(110, 70, rect)).toBe(true);
  });
  it('detects point outside', () => {
    expect(isPointInRect(0, 0, rect)).toBe(false);
    expect(isPointInRect(200, 100, rect)).toBe(false);
  });
  it('normalises negative width/height', () => {
    const flipped: RectShape = { ...rect, w: -100, h: -50, x: 110, y: 70 };
    expect(isPointInRect(50, 40, flipped)).toBe(true);
  });
});

describe('PALETTE', () => {
  it('has 8 colors', () => {
    expect(PALETTE).toHaveLength(8);
  });
  it('each entry is a valid hex', () => {
    expect(PALETTE.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
  });
});

describe('normaliseRect', () => {
  it('returns positive width/height even when input is flipped', () => {
    expect(normaliseRect({ x: 100, y: 80, w: -40, h: -20 })).toEqual({
      x: 60,
      y: 60,
      w: 40,
      h: 20,
    });
  });
  it('passes through already-positive rectangles', () => {
    expect(normaliseRect({ x: 10, y: 20, w: 30, h: 40 })).toEqual({
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    });
  });
});

describe('shapeBBox', () => {
  it('rect / highlight uses normalised corners', () => {
    expect(
      shapeBBox({
        id: 'r',
        kind: 'rect',
        color: '#000',
        strokeWidth: 2,
        x: 10,
        y: 20,
        w: -5,
        h: 30,
      }),
    ).toEqual({
      left: 5,
      top: 20,
      right: 10,
      bottom: 50,
    });
  });
  it('arrow / line uses min/max endpoints', () => {
    expect(
      shapeBBox({
        id: 'a',
        kind: 'arrow',
        color: '#000',
        strokeWidth: 2,
        x1: 50,
        y1: 10,
        x2: 20,
        y2: 60,
      }),
    ).toEqual({
      left: 20,
      right: 50,
      top: 10,
      bottom: 60,
    });
  });
  it('text approximates a width from char count and font size', () => {
    const t: Shape = {
      id: 't',
      kind: 'text',
      color: '#000',
      strokeWidth: 1,
      x: 100,
      y: 200,
      text: 'abc',
      fontSize: 10,
    };
    const b = shapeBBox(t);
    expect(b.left).toBe(100);
    expect(b.top).toBe(200);
    expect(b.bottom).toBe(210);
    expect(b.right).toBeGreaterThan(b.left);
  });
});

describe('translateShapesForCrop', () => {
  const shapes: Shape[] = [
    { id: 'in', kind: 'rect', color: '#000', strokeWidth: 2, x: 110, y: 120, w: 50, h: 40 },
    { id: 'out', kind: 'rect', color: '#000', strokeWidth: 2, x: 500, y: 500, w: 10, h: 10 },
    {
      id: 'partial',
      kind: 'arrow',
      color: '#000',
      strokeWidth: 2,
      x1: 90,
      y1: 150,
      x2: 130,
      y2: 150,
    },
    {
      id: 't',
      kind: 'text',
      color: '#000',
      strokeWidth: 1,
      x: 200,
      y: 130,
      text: 'Hi',
      fontSize: 16,
    },
  ];
  const crop = { x: 100, y: 100, w: 200, h: 200 };

  it('drops shapes fully outside the crop', () => {
    const next = translateShapesForCrop(shapes, crop);
    expect(next.find((s) => s.id === 'out')).toBeUndefined();
  });

  it('translates remaining shapes by -crop.x / -crop.y', () => {
    const next = translateShapesForCrop(shapes, crop);
    const rect = next.find((s) => s.id === 'in');
    expect(rect && rect.kind === 'rect' ? rect.x : null).toBe(10);
    expect(rect && rect.kind === 'rect' ? rect.y : null).toBe(20);
  });

  it('keeps shapes that straddle the crop boundary', () => {
    const next = translateShapesForCrop(shapes, crop);
    expect(next.find((s) => s.id === 'partial')).toBeDefined();
  });

  it('keeps text inside crop and translates it', () => {
    const next = translateShapesForCrop(shapes, crop);
    const text = next.find((s) => s.id === 't');
    expect(text && text.kind === 'text' ? text.x : null).toBe(100);
  });

  it('treats flipped crop the same as normalised one', () => {
    const flipped = { x: 300, y: 300, w: -200, h: -200 };
    expect(
      translateShapesForCrop(shapes, flipped)
        .map((s) => s.id)
        .sort(),
    ).toEqual(
      translateShapesForCrop(shapes, crop)
        .map((s) => s.id)
        .sort(),
    );
  });
});

describe('drawShapes', () => {
  function mockCtx() {
    return {
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineJoin: '',
      lineCap: '',
      globalAlpha: 1,
      font: '',
      textBaseline: '',
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    } as unknown as CanvasRenderingContext2D & {
      strokeRect: ReturnType<typeof vi.fn>;
      fillRect: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
      restore: ReturnType<typeof vi.fn>;
      stroke: ReturnType<typeof vi.fn>;
    };
  }

  it('rect calls strokeRect', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      { id: 'a', kind: 'rect', color: '#000', strokeWidth: 2, x: 0, y: 0, w: 10, h: 10 },
    ]);
    expect(ctx.strokeRect).toHaveBeenCalledOnce();
  });

  it('highlight wraps fillRect in save/restore for alpha', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      { id: 'h', kind: 'highlight', color: '#ff0', strokeWidth: 2, x: 0, y: 0, w: 10, h: 10 },
    ]);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('line strokes a segment without arrow head', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      { id: 'l', kind: 'line', color: '#000', strokeWidth: 2, x1: 0, y1: 0, x2: 10, y2: 0 },
    ]);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
