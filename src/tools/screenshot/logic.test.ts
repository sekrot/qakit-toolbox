import { describe, expect, it, vi } from 'vitest';
import {
  canvasRectToScreenRect,
  canUndo,
  canRedo,
  clampFloatingPosition,
  currentSnapshot,
  drawShapes,
  findShapeAt,
  FONT_STACKS,
  hitTestShape,
  initHistory,
  isPointInRect,
  makeId,
  normaliseRect,
  PALETTE,
  pixelationGridSize,
  pointInPolygon,
  pushHistory,
  redoHistory,
  resetHistory,
  sampleQuadratic,
  shapeBBox,
  stepShapeIds,
  translateShape,
  translateShapesForCrop,
  undoHistory,
  type CurveShape,
  type EditorSnapshot,
  type FreeformShape,
  type PenShape,
  type RectShape,
  type Shape,
  type StepNumberShape,
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
      canvas: { width: 200, height: 200 },
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineJoin: '',
      lineCap: '',
      globalAlpha: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      imageSmoothingEnabled: true,
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 42 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      ellipse: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D & {
      strokeRect: ReturnType<typeof vi.fn>;
      fillRect: ReturnType<typeof vi.fn>;
      fillText: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
      restore: ReturnType<typeof vi.fn>;
      stroke: ReturnType<typeof vi.fn>;
      fill: ReturnType<typeof vi.fn>;
      closePath: ReturnType<typeof vi.fn>;
      ellipse: ReturnType<typeof vi.fn>;
      quadraticCurveTo: ReturnType<typeof vi.fn>;
      arc: ReturnType<typeof vi.fn>;
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

  it('pen connects every recorded point with lineTo', () => {
    const ctx = mockCtx() as ReturnType<typeof mockCtx> & { lineTo: ReturnType<typeof vi.fn> };
    const pen: PenShape = {
      id: 'p',
      kind: 'pen',
      color: '#000',
      strokeWidth: 2,
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 0 },
      ],
    };
    drawShapes(ctx, [pen]);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.lineTo as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });
});

describe('pen shape', () => {
  const pen: PenShape = {
    id: 'p',
    kind: 'pen',
    color: '#000',
    strokeWidth: 2,
    points: [
      { x: 10, y: 20 },
      { x: 50, y: 60 },
      { x: 30, y: 100 },
    ],
  };

  it('bbox spans min/max over all points', () => {
    expect(shapeBBox(pen)).toEqual({ left: 10, top: 20, right: 50, bottom: 100 });
  });
  it('translate shifts every point', () => {
    const moved = translateShape(pen, -5, 10) as PenShape;
    expect(moved.points).toEqual([
      { x: 5, y: 30 },
      { x: 45, y: 70 },
      { x: 25, y: 110 },
    ]);
  });
});

describe('hitTestShape', () => {
  const rect: RectShape = {
    id: 'r',
    kind: 'rect',
    color: '#000',
    strokeWidth: 2,
    x: 100,
    y: 100,
    w: 100,
    h: 80,
  };

  it('rect hits along an edge but not the centre', () => {
    expect(hitTestShape(rect, 100, 140, 4)).toBe(true); // left edge
    expect(hitTestShape(rect, 150, 100, 4)).toBe(true); // top edge
    expect(hitTestShape(rect, 150, 140, 4)).toBe(false); // middle interior
  });

  it('arrow / line hits near the segment', () => {
    const arr: Shape = {
      id: 'a',
      kind: 'arrow',
      color: '#000',
      strokeWidth: 2,
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
    };
    expect(hitTestShape(arr, 50, 2, 4)).toBe(true);
    expect(hitTestShape(arr, 50, 30, 4)).toBe(false);
  });

  it('pen hits along the polyline', () => {
    const pen: PenShape = {
      id: 'p',
      kind: 'pen',
      color: '#000',
      strokeWidth: 2,
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ],
    };
    expect(hitTestShape(pen, 25, 25, 4)).toBe(true);
    expect(hitTestShape(pen, 25, 100, 4)).toBe(false);
  });

  it('text hits inside its approximate bbox', () => {
    const t: Shape = {
      id: 't',
      kind: 'text',
      color: '#000',
      strokeWidth: 1,
      x: 100,
      y: 100,
      text: 'Hello',
      fontSize: 16,
    };
    expect(hitTestShape(t, 102, 102, 0)).toBe(true);
    expect(hitTestShape(t, 1000, 100, 0)).toBe(false);
  });
});

describe('findShapeAt', () => {
  const shapes: Shape[] = [
    { id: 'a', kind: 'rect', color: '#000', strokeWidth: 2, x: 0, y: 0, w: 100, h: 100 },
    { id: 'b', kind: 'rect', color: '#fff', strokeWidth: 2, x: 50, y: 50, w: 100, h: 100 },
  ];

  it('returns the topmost shape when multiple overlap', () => {
    // Point (60, 60) is near the top edge of `b` (top edge at y=50), not on `a`'s edges.
    const hit = findShapeAt(shapes, 60, 50, 4);
    expect(hit?.id).toBe('b');
  });

  it('returns null when nothing is hit', () => {
    expect(findShapeAt(shapes, 500, 500)).toBeNull();
  });
});

describe('FONT_STACKS', () => {
  it('locks the 3-entry contract', () => {
    expect(FONT_STACKS).toEqual([
      { id: 'sans', css: `ui-sans-serif, system-ui, sans-serif` },
      { id: 'serif', css: `Georgia, 'Times New Roman', serif` },
      { id: 'mono', css: `'Courier New', ui-monospace, monospace` },
    ]);
  });
});

describe('pixelationGridSize', () => {
  it('divides dimensions by block size and rounds to at least 1', () => {
    expect(pixelationGridSize(100, 50, 10)).toEqual({ rw: 10, rh: 5 });
    expect(pixelationGridSize(3, 3, 10)).toEqual({ rw: 1, rh: 1 });
  });
});

describe('pointInPolygon', () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 },
  ];
  it('detects a point clearly inside', () => {
    expect(pointInPolygon(50, 30, triangle)).toBe(true);
  });
  it('detects a point clearly outside', () => {
    expect(pointInPolygon(5, 90, triangle)).toBe(false);
  });
  it('handles a square too', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon(5, 5, square)).toBe(true);
    expect(pointInPolygon(20, 20, square)).toBe(false);
  });
});

describe('sampleQuadratic / curve bbox', () => {
  it('bulging control point expands the bbox beyond the naive endpoint-only box', () => {
    const curve: CurveShape = {
      id: 'c',
      kind: 'curve',
      color: '#000',
      strokeWidth: 2,
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      cx: 50,
      cy: 200,
    };
    const naiveBottom = Math.max(curve.y1, curve.y2);
    const b = shapeBBox(curve);
    expect(b.bottom).toBeGreaterThan(naiveBottom);
  });

  it('samples steps+1 points including both endpoints', () => {
    const curve: CurveShape = {
      id: 'c',
      kind: 'curve',
      color: '#000',
      strokeWidth: 2,
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      cx: 5,
      cy: 5,
    };
    const pts = sampleQuadratic(curve, 4);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[4]).toEqual({ x: 10, y: 10 });
  });
});

describe('stepShapeIds', () => {
  it('preserves array order among mixed shape kinds', () => {
    const shapes: Shape[] = [
      { id: 's1', kind: 'stepNumber', color: '#f00', strokeWidth: 1, x: 0, y: 0, size: 20 },
      { id: 'r1', kind: 'rect', color: '#000', strokeWidth: 1, x: 0, y: 0, w: 5, h: 5 },
      { id: 's2', kind: 'stepNumber', color: '#f00', strokeWidth: 1, x: 10, y: 10, size: 20 },
      { id: 's3', kind: 'stepNumber', color: '#f00', strokeWidth: 1, x: 20, y: 20, size: 20 },
    ];
    expect(stepShapeIds(shapes)).toEqual(['s1', 's2', 's3']);
  });

  it('renumbers automatically once earlier steps are removed', () => {
    const step = (id: string): StepNumberShape => ({
      id,
      kind: 'stepNumber',
      color: '#f00',
      strokeWidth: 1,
      x: 0,
      y: 0,
      size: 20,
    });
    const full = [step('s1'), step('s2'), step('s3'), step('s4'), step('s5')];
    expect(stepShapeIds(full)).toEqual(['s1', 's2', 's3', 's4', 's5']);
    // Simulate undoing the two most-recently-added steps.
    const afterUndo = full.slice(0, 3);
    expect(stepShapeIds(afterUndo).map((id, i) => ({ id, label: i + 1 }))).toEqual([
      { id: 's1', label: 1 },
      { id: 's2', label: 2 },
      { id: 's3', label: 3 },
    ]);
  });
});

describe('new shape kinds in shapeBBox / hitTestShape / translateShape', () => {
  it('ellipse shares the rect-style bbox and translate', () => {
    const ellipse: Shape = {
      id: 'e',
      kind: 'ellipse',
      color: '#000',
      strokeWidth: 1,
      x: 10,
      y: 10,
      w: 20,
      h: 10,
    };
    expect(shapeBBox(ellipse)).toEqual({ left: 10, top: 10, right: 30, bottom: 20 });
    const moved = translateShape(ellipse, 5, -5);
    expect(moved).toMatchObject({ x: 15, y: 5 });
  });

  it('blur shares the rect-style bbox, translate and hitTest', () => {
    const blur: Shape = {
      id: 'b',
      kind: 'blur',
      color: '#000',
      strokeWidth: 1,
      x: 10,
      y: 10,
      w: 20,
      h: 20,
      intensity: 8,
    };
    expect(shapeBBox(blur)).toEqual({ left: 10, top: 10, right: 30, bottom: 30 });
    expect(hitTestShape(blur, 20, 20, 0)).toBe(true);
    expect(hitTestShape(blur, 1000, 1000, 0)).toBe(false);
  });

  it('marker shares pen-style bbox, translate and edge hitTest', () => {
    const marker: Shape = {
      id: 'm',
      kind: 'marker',
      color: '#ff0',
      strokeWidth: 4,
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
      ],
    };
    expect(shapeBBox(marker)).toEqual({ left: 0, top: 0, right: 20, bottom: 0 });
    expect(hitTestShape(marker, 10, 0, 2)).toBe(true);
    const moved = translateShape(marker, 5, 5) as typeof marker;
    expect(moved.points).toEqual([
      { x: 5, y: 5 },
      { x: 25, y: 5 },
    ]);
  });

  it('freeform selects by interior click, not just edges', () => {
    const freeform: FreeformShape = {
      id: 'f',
      kind: 'freeform',
      color: '#0f0',
      strokeWidth: 2,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
    };
    expect(hitTestShape(freeform, 50, 50, 0)).toBe(true); // deep interior
    expect(hitTestShape(freeform, 500, 500, 0)).toBe(false);
    const moved = translateShape(freeform, 10, 10) as FreeformShape;
    expect(moved.points[0]).toEqual({ x: 10, y: 10 });
  });

  it('curve hitTest follows the sampled Bézier path', () => {
    const curve: CurveShape = {
      id: 'c',
      kind: 'curve',
      color: '#000',
      strokeWidth: 2,
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      cx: 50,
      cy: 60,
    };
    // Near the curve's peak (roughly y=30 at x=50), not near the naive straight chord.
    expect(hitTestShape(curve, 50, 30, 4)).toBe(true);
    expect(hitTestShape(curve, 50, 0, 2)).toBe(false);
  });

  it('stepNumber bbox/hitTest is a circle around its center; translate shifts center', () => {
    const step: StepNumberShape = {
      id: 's',
      kind: 'stepNumber',
      color: '#f00',
      strokeWidth: 1,
      x: 50,
      y: 50,
      size: 20,
    };
    expect(shapeBBox(step)).toEqual({ left: 40, top: 40, right: 60, bottom: 60 });
    expect(hitTestShape(step, 55, 50, 0)).toBe(true);
    expect(hitTestShape(step, 500, 500, 0)).toBe(false);
    const moved = translateShape(step, 1, 2) as StepNumberShape;
    expect(moved).toMatchObject({ x: 51, y: 52 });
  });

  it('emoji bbox is a size-sided square anchored at its top-left', () => {
    const emoji: Shape = {
      id: 'em',
      kind: 'emoji',
      color: '#000',
      strokeWidth: 1,
      x: 10,
      y: 10,
      char: '🎉',
      size: 24,
    };
    expect(shapeBBox(emoji)).toEqual({ left: 10, top: 10, right: 34, bottom: 34 });
    expect(hitTestShape(emoji, 20, 20, 0)).toBe(true);
  });
});

describe('translateShapesForCrop with new shape kinds', () => {
  it('keeps and rebases curve / freeform / blur shapes', () => {
    const shapes: Shape[] = [
      {
        id: 'c',
        kind: 'curve',
        color: '#000',
        strokeWidth: 2,
        x1: 110,
        y1: 120,
        x2: 150,
        y2: 120,
        cx: 130,
        cy: 100,
      },
      {
        id: 'f',
        kind: 'freeform',
        color: '#000',
        strokeWidth: 2,
        points: [
          { x: 110, y: 110 },
          { x: 130, y: 110 },
          { x: 120, y: 130 },
        ],
      },
      {
        id: 'b',
        kind: 'blur',
        color: '#000',
        strokeWidth: 1,
        x: 110,
        y: 110,
        w: 20,
        h: 20,
        intensity: 8,
      },
    ];
    const crop = { x: 100, y: 100, w: 200, h: 200 };
    const next = translateShapesForCrop(shapes, crop);
    expect(next.map((s) => s.id).sort()).toEqual(['b', 'c', 'f']);
    const blur = next.find((s) => s.id === 'b');
    expect(blur && blur.kind === 'blur' ? { x: blur.x, y: blur.y } : null).toEqual({
      x: 10,
      y: 10,
    });
  });
});

describe('drawShapes new branches', () => {
  function mockCtx() {
    return {
      canvas: { width: 200, height: 200 },
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineJoin: '',
      lineCap: '',
      globalAlpha: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      imageSmoothingEnabled: true,
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 42 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      ellipse: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D & {
      strokeRect: ReturnType<typeof vi.fn>;
      fillRect: ReturnType<typeof vi.fn>;
      fillText: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
      restore: ReturnType<typeof vi.fn>;
      stroke: ReturnType<typeof vi.fn>;
      fill: ReturnType<typeof vi.fn>;
      closePath: ReturnType<typeof vi.fn>;
      ellipse: ReturnType<typeof vi.fn>;
      quadraticCurveTo: ReturnType<typeof vi.fn>;
      arc: ReturnType<typeof vi.fn>;
      font: string;
    };
  }

  it('marker wraps its stroke in save/restore for alpha, like highlight', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      {
        id: 'm',
        kind: 'marker',
        color: '#ff0',
        strokeWidth: 4,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      },
    ]);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('ellipse calls ctx.ellipse with half-width/height radii', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      { id: 'e', kind: 'ellipse', color: '#000', strokeWidth: 1, x: 0, y: 0, w: 20, h: 10 },
    ]);
    expect(ctx.ellipse).toHaveBeenCalledWith(10, 5, 10, 5, 0, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('freeform closes the path and both fills and strokes it', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      {
        id: 'f',
        kind: 'freeform',
        color: '#0f0',
        strokeWidth: 2,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 10 },
        ],
      },
    ]);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('curve calls quadraticCurveTo with the control point', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      {
        id: 'c',
        kind: 'curve',
        color: '#000',
        strokeWidth: 2,
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10,
        cx: 5,
        cy: -5,
      },
    ]);
    expect(ctx.quadraticCurveTo).toHaveBeenCalledWith(5, -5, 10, 10);
  });

  it('stepNumber draws a circle via arc and fills the computed label text', () => {
    const ctx = mockCtx();
    const shapes: Shape[] = [
      { id: 's1', kind: 'stepNumber', color: '#f00', strokeWidth: 1, x: 0, y: 0, size: 20 },
      { id: 's2', kind: 'stepNumber', color: '#f00', strokeWidth: 1, x: 10, y: 10, size: 20 },
    ];
    drawShapes(ctx, shapes);
    expect(ctx.arc).toHaveBeenCalledTimes(2);
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '1', 0, 1);
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '2', 10, 11);
  });

  it('emoji draws the character via fillText', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      { id: 'em', kind: 'emoji', color: '#000', strokeWidth: 1, x: 5, y: 5, char: '🎉', size: 24 },
    ]);
    expect(ctx.fillText).toHaveBeenCalledWith('🎉', 5, 5);
  });

  it('text builds the font string from bold/italic/fontFamily', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      {
        id: 't',
        kind: 'text',
        color: '#000',
        strokeWidth: 1,
        x: 0,
        y: 0,
        text: 'Hi',
        fontSize: 16,
        fontFamily: 'serif',
        bold: true,
        italic: true,
      },
    ]);
    expect(ctx.font).toBe(`italic bold 16px Georgia, 'Times New Roman', serif`);
  });

  it('text underline draws an extra fillRect under each line', () => {
    const ctx = mockCtx();
    drawShapes(ctx, [
      {
        id: 't',
        kind: 'text',
        color: '#000',
        strokeWidth: 1,
        x: 0,
        y: 0,
        text: 'Hi',
        fontSize: 16,
        underline: true,
      },
    ]);
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});

describe('history: init / push / undo / redo / reset', () => {
  const snap = (imgUrl: string, shapes: Shape[] = []): EditorSnapshot => ({ imgUrl, shapes });

  it('initHistory seeds a single entry at index 0', () => {
    const h = initHistory('data:orig');
    expect(h.entries).toHaveLength(1);
    expect(h.index).toBe(0);
    expect(currentSnapshot(h)).toEqual({ imgUrl: 'data:orig', shapes: [] });
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it('pushHistory appends and advances the pointer', () => {
    let h = initHistory('data:orig');
    h = pushHistory(h, snap('data:orig', [{ id: 'a' } as unknown as Shape]));
    expect(h.index).toBe(1);
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  it('undo/redo move the pointer and clamp at both ends', () => {
    let h = initHistory('data:orig');
    h = pushHistory(h, snap('data:orig', [{ id: 'a' } as unknown as Shape]));
    h = pushHistory(
      h,
      snap('data:orig', [{ id: 'a' } as unknown as Shape, { id: 'b' } as unknown as Shape]),
    );
    expect(h.index).toBe(2);

    h = undoHistory(h);
    expect(h.index).toBe(1);
    h = undoHistory(h);
    expect(h.index).toBe(0);
    h = undoHistory(h); // clamps
    expect(h.index).toBe(0);

    h = redoHistory(h);
    h = redoHistory(h);
    expect(h.index).toBe(2);
    h = redoHistory(h); // clamps
    expect(h.index).toBe(2);
  });

  it('pushHistory truncates the redo branch after a mid-stack undo', () => {
    let h = initHistory('data:orig');
    h = pushHistory(h, snap('data:orig', [{ id: 'a' } as unknown as Shape]));
    h = pushHistory(
      h,
      snap('data:orig', [{ id: 'a' } as unknown as Shape, { id: 'b' } as unknown as Shape]),
    );
    h = undoHistory(h); // back to the 1-shape entry, index 1; entries.length still 3
    expect(canRedo(h)).toBe(true);

    h = pushHistory(
      h,
      snap('data:orig', [{ id: 'a' } as unknown as Shape, { id: 'c' } as unknown as Shape]),
    );
    expect(h.entries).toHaveLength(3); // the old "b" branch was dropped
    expect(canRedo(h)).toBe(false);
    expect(currentSnapshot(h).shapes.map((s) => (s as unknown as { id: string }).id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('resetHistory jumps to index 0 without truncating — redo still works afterward', () => {
    let h = initHistory('data:orig');
    h = pushHistory(h, snap('data:orig', [{ id: 'a' } as unknown as Shape]));
    h = pushHistory(
      h,
      snap('data:orig', [{ id: 'a' } as unknown as Shape, { id: 'b' } as unknown as Shape]),
    );
    h = resetHistory(h);
    expect(h.index).toBe(0);
    expect(currentSnapshot(h)).toEqual({ imgUrl: 'data:orig', shapes: [] });
    expect(canRedo(h)).toBe(true);
    h = redoHistory(h);
    expect(h.index).toBe(1);
  });

  it('eviction never removes entries[0] (the original capture)', () => {
    let h = initHistory('data:orig');
    for (let i = 0; i < 10; i++) {
      h = pushHistory(h, snap('data:orig', [{ id: `s${i}` } as unknown as Shape]), 5);
    }
    expect(h.entries.length).toBeLessThanOrEqual(5);
    expect(h.entries[0]).toEqual({ imgUrl: 'data:orig', shapes: [] });
    expect(currentSnapshot(h).shapes).toEqual([{ id: 's9' }]);
  });
});

describe('clampFloatingPosition', () => {
  const size = { w: 60, h: 30 };
  const bounds = { w: 300, h: 200 };

  it('leaves an already-fitting position untouched', () => {
    expect(clampFloatingPosition({ left: 50, top: 50 }, size, bounds)).toEqual({
      left: 50,
      top: 50,
    });
  });

  it('clamps a position that overflows the right/bottom edges', () => {
    expect(clampFloatingPosition({ left: 290, top: 195 }, size, bounds)).toEqual({
      left: 240,
      top: 170,
    });
  });

  it('clamps a negative position back to 0', () => {
    expect(clampFloatingPosition({ left: -20, top: -5 }, size, bounds)).toEqual({
      left: 0,
      top: 0,
    });
  });
});

describe('canvasRectToScreenRect', () => {
  it('scales a canvas-pixel rect into screen pixels', () => {
    const rect = canvasRectToScreenRect(
      { x: 100, y: 50, w: 40, h: 20 },
      { w: 400, h: 200 },
      { w: 200, h: 100 },
    );
    expect(rect).toEqual({ left: 50, top: 25, width: 20, height: 10 });
  });

  it('normalises a flipped rect first', () => {
    const rect = canvasRectToScreenRect(
      { x: 140, y: 70, w: -40, h: -20 },
      { w: 400, h: 200 },
      { w: 200, h: 100 },
    );
    expect(rect).toEqual({ left: 50, top: 25, width: 20, height: 10 });
  });
});
