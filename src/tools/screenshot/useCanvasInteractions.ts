import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { PALETTE } from '@/lib/palette';
import {
  findShapeAt,
  makeId,
  translateShape,
  type CropRect,
  type CurveShape,
  type Shape,
  type TextFontFamily,
} from './logic';

export type Tool =
  | 'select'
  | 'pen'
  | 'marker'
  | 'eraser'
  | 'text'
  | 'arrow'
  | 'rect'
  | 'highlight'
  | 'blur'
  | 'crop'
  | 'stepNumber'
  | 'emoji';

export type ArrowVariant = 'single' | 'double' | 'line' | 'curve';
export type RectVariant = 'rect' | 'ellipse' | 'freeform';

export interface CanvasSettings {
  color: string;
  strokeWidth: number;
  fontFamily: TextFontFamily;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  blurIntensity: number;
  stepSize: number;
  emojiChar: string;
  emojiSize: number;
}

export const DEFAULT_SETTINGS: CanvasSettings = {
  color: PALETTE[0],
  strokeWidth: 3,
  fontFamily: 'sans',
  fontSize: 24,
  bold: false,
  italic: false,
  underline: false,
  blurIntensity: 12,
  stepSize: 28,
  emojiChar: '😀',
  emojiSize: 32,
};

export interface TextDraft {
  /** Top-left in canvas coordinates (used for the final TextShape). */
  x: number;
  y: number;
  /** Top-left in wrapper (screen) coordinates for positioning the <textarea>. */
  screenX: number;
  screenY: number;
  /** Screen-space size of the floating editor; mirrors textarea resize. */
  screenW: number;
  screenH: number;
}

const DEFAULT_TEXT_W = 220;
const DEFAULT_TEXT_H = 80;

interface DragState {
  shapeId: string;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
}

interface CurveDraft {
  phase: 'endpoints' | 'handle';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
}

function curveDraftToShape(draft: CurveDraft, color: string, strokeWidth: number): CurveShape {
  return {
    id: makeId(),
    kind: 'curve',
    color,
    strokeWidth,
    x1: draft.x1,
    y1: draft.y1,
    x2: draft.x2,
    y2: draft.y2,
    cx: draft.cx,
    cy: draft.cy,
  };
}

export interface UseCanvasInteractionsParams {
  img: HTMLImageElement | null;
  canvasRef: RefObject<HTMLCanvasElement>;
  wrapperRef: RefObject<HTMLDivElement>;
  tool: Tool;
  arrowVariant: ArrowVariant;
  rectVariant: RectVariant;
  settings: CanvasSettings;
  shapes: Shape[];
  onCommitShapes: (next: Shape[]) => void;
  onApplyCrop: (rect: CropRect) => void;
}

export function useCanvasInteractions({
  img,
  canvasRef,
  wrapperRef,
  tool,
  arrowVariant,
  rectVariant,
  settings,
  shapes,
  onCommitShapes,
  onApplyCrop,
}: UseCanvasInteractionsParams) {
  const [drawing, setDrawing] = useState<Shape | null>(null);
  const [cropDraft, setCropDraft] = useState<CropRect | null>(null);
  const [curveDraft, setCurveDraft] = useState<CurveDraft | null>(null);
  const [draggingHandle, setDraggingHandle] = useState(false);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset ephemeral drafts whenever the active tool changes.
  useEffect(() => {
    setCropDraft(null);
    setCurveDraft(null);
    setDraggingHandle(false);
    setDrawing(null);
    setTextDraft(null);
    setTextValue('');
    setDrag(null);
    if (tool !== 'select') setSelectedId(null);
  }, [tool]);

  // Focus inline text input when it appears.
  useEffect(() => {
    if (textDraft) {
      const id = window.setTimeout(() => textInputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [textDraft]);

  // Escape cancels a pending curve draft; Delete/Backspace removes the selected shape.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && curveDraft) {
        setCurveDraft(null);
        setDraggingHandle(false);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && tool === 'select') {
        const active = document.activeElement;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return;
        onCommitShapes(shapes.filter((s) => s.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [curveDraft, selectedId, tool, shapes, onCommitShapes]);

  const toCanvasCoords = (e: ReactMouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onPointerDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!img) return;
    if (textDraft) return; // typing in progress — wait for commit
    const { x, y } = toCanvasCoords(e);

    if (curveDraft) {
      if (curveDraft.phase === 'handle') {
        const distToHandle = Math.hypot(x - curveDraft.cx, y - curveDraft.cy);
        if (distToHandle <= 12) {
          setDraggingHandle(true);
        } else {
          onCommitShapes([
            ...shapes,
            curveDraftToShape(curveDraft, settings.color, settings.strokeWidth),
          ]);
          setCurveDraft(null);
          setDraggingHandle(false);
        }
      }
      return;
    }

    if (tool === 'select') {
      const hit = findShapeAt(shapes, x, y);
      if (hit) {
        setSelectedId(hit.id);
        setDrag({ shapeId: hit.id, startX: x, startY: y, dx: 0, dy: 0 });
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === 'eraser') {
      const hit = findShapeAt(shapes, x, y);
      if (hit) onCommitShapes(shapes.filter((s) => s.id !== hit.id));
      return;
    }

    if (tool === 'text') {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const wrap = wrapperRef.current!.getBoundingClientRect();
      setTextValue('');
      setTextDraft({
        x,
        y,
        screenX: rect.left - wrap.left + (x / canvas.width) * rect.width,
        screenY: rect.top - wrap.top + (y / canvas.height) * rect.height,
        screenW: DEFAULT_TEXT_W,
        screenH: DEFAULT_TEXT_H,
      });
      return;
    }

    if (tool === 'crop') {
      setCropDraft({ x, y, w: 0, h: 0 });
      return;
    }

    if (tool === 'stepNumber') {
      onCommitShapes([
        ...shapes,
        {
          id: makeId(),
          kind: 'stepNumber',
          color: settings.color,
          strokeWidth: 1,
          x,
          y,
          size: settings.stepSize,
        },
      ]);
      return;
    }

    if (tool === 'emoji') {
      onCommitShapes([
        ...shapes,
        {
          id: makeId(),
          kind: 'emoji',
          color: settings.color,
          strokeWidth: 1,
          x,
          y,
          char: settings.emojiChar,
          size: settings.emojiSize,
        },
      ]);
      return;
    }

    setSelectedId(null);
    if (tool === 'arrow') {
      if (arrowVariant === 'curve') {
        setCurveDraft({ phase: 'endpoints', x1: x, y1: y, x2: x, y2: y, cx: x, cy: y });
      } else if (arrowVariant === 'line') {
        setDrawing({
          id: makeId(),
          kind: 'line',
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
        });
      } else {
        setDrawing({
          id: makeId(),
          kind: 'arrow',
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          variant: arrowVariant,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
        });
      }
    } else if (tool === 'rect') {
      if (rectVariant === 'ellipse') {
        setDrawing({
          id: makeId(),
          kind: 'ellipse',
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          x,
          y,
          w: 0,
          h: 0,
        });
      } else if (rectVariant === 'freeform') {
        setDrawing({
          id: makeId(),
          kind: 'freeform',
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          points: [{ x, y }],
        });
      } else {
        setDrawing({
          id: makeId(),
          kind: 'rect',
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          x,
          y,
          w: 0,
          h: 0,
        });
      }
    } else if (tool === 'highlight') {
      setDrawing({
        id: makeId(),
        kind: 'highlight',
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        x,
        y,
        w: 0,
        h: 0,
      });
    } else if (tool === 'pen') {
      setDrawing({
        id: makeId(),
        kind: 'pen',
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        points: [{ x, y }],
      });
    } else if (tool === 'marker') {
      setDrawing({
        id: makeId(),
        kind: 'marker',
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        points: [{ x, y }],
      });
    } else if (tool === 'blur') {
      setDrawing({
        id: makeId(),
        kind: 'blur',
        color: '#000000',
        strokeWidth: 1,
        x,
        y,
        w: 0,
        h: 0,
        intensity: settings.blurIntensity,
      });
    }
  };

  const onPointerMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (drag && tool === 'select' && e.buttons === 1) {
      const { x, y } = toCanvasCoords(e);
      setDrag({ ...drag, dx: x - drag.startX, dy: y - drag.startY });
      return;
    }
    if (curveDraft && e.buttons === 1) {
      const { x, y } = toCanvasCoords(e);
      if (curveDraft.phase === 'endpoints') {
        setCurveDraft({
          ...curveDraft,
          x2: x,
          y2: y,
          cx: (curveDraft.x1 + x) / 2,
          cy: (curveDraft.y1 + y) / 2,
        });
      } else if (curveDraft.phase === 'handle' && draggingHandle) {
        setCurveDraft({ ...curveDraft, cx: x, cy: y });
      }
      return;
    }
    if (cropDraft && tool === 'crop' && e.buttons === 1) {
      const { x, y } = toCanvasCoords(e);
      setCropDraft({ ...cropDraft, w: x - cropDraft.x, h: y - cropDraft.y });
      return;
    }
    if (!drawing) return;
    const { x, y } = toCanvasCoords(e);
    if (
      drawing.kind === 'rect' ||
      drawing.kind === 'highlight' ||
      drawing.kind === 'ellipse' ||
      drawing.kind === 'blur'
    ) {
      setDrawing({ ...drawing, w: x - drawing.x, h: y - drawing.y });
    } else if (drawing.kind === 'arrow' || drawing.kind === 'line') {
      setDrawing({ ...drawing, x2: x, y2: y });
    } else if (drawing.kind === 'pen' || drawing.kind === 'marker' || drawing.kind === 'freeform') {
      const last = drawing.points[drawing.points.length - 1];
      if (Math.hypot(x - last.x, y - last.y) >= 1.5) {
        setDrawing({ ...drawing, points: [...drawing.points, { x, y }] });
      }
    }
  };

  const onPointerUp = () => {
    if (drag) {
      if (drag.dx !== 0 || drag.dy !== 0) {
        onCommitShapes(
          shapes.map((s) => (s.id === drag.shapeId ? translateShape(s, drag.dx, drag.dy) : s)),
        );
      }
      setDrag(null);
      return;
    }
    if (curveDraft) {
      if (curveDraft.phase === 'endpoints') {
        const len = Math.hypot(curveDraft.x2 - curveDraft.x1, curveDraft.y2 - curveDraft.y1);
        if (len < 4) {
          setCurveDraft(null);
          return;
        }
        setCurveDraft({ ...curveDraft, phase: 'handle' });
        return;
      }
      if (draggingHandle) {
        setDraggingHandle(false);
        onCommitShapes([
          ...shapes,
          curveDraftToShape(curveDraft, settings.color, settings.strokeWidth),
        ]);
        setCurveDraft(null);
      }
      return;
    }
    if (drawing) {
      const isRectLike =
        drawing.kind === 'rect' ||
        drawing.kind === 'highlight' ||
        drawing.kind === 'ellipse' ||
        drawing.kind === 'blur';
      if (isRectLike && (Math.abs(drawing.w) < 2 || Math.abs(drawing.h) < 2)) {
        setDrawing(null);
      } else {
        onCommitShapes([...shapes, drawing]);
        setDrawing(null);
      }
    }
  };

  const cropPending = Boolean(
    tool === 'crop' && cropDraft && Math.abs(cropDraft.w) >= 4 && Math.abs(cropDraft.h) >= 4,
  );

  const applyCrop = () => {
    if (!cropDraft) return;
    if (Math.abs(cropDraft.w) < 4 || Math.abs(cropDraft.h) < 4) {
      setCropDraft(null);
      return;
    }
    onApplyCrop(cropDraft);
    setCropDraft(null);
  };

  const cancelCrop = () => setCropDraft(null);

  const commitText = () => {
    if (!textDraft) return;
    // Don't trim — multi-line text may legitimately end with newline. Drop only
    // wholly-empty drafts.
    const value = textValue.replace(/\s+$/u, '');
    if (value) {
      const canvas = canvasRef.current;
      const scale = canvas ? canvas.width / canvas.getBoundingClientRect().width : 1;
      const canvasWidth = textDraft.screenW * scale;
      onCommitShapes([
        ...shapes,
        {
          id: makeId(),
          kind: 'text',
          color: settings.color,
          strokeWidth: settings.strokeWidth,
          x: textDraft.x,
          y: textDraft.y,
          text: value,
          fontSize: settings.fontSize,
          width: canvasWidth,
          fontFamily: settings.fontFamily,
          bold: settings.bold,
          italic: settings.italic,
          underline: settings.underline,
        },
      ]);
    }
    setTextDraft(null);
    setTextValue('');
  };

  const cancelText = () => {
    setTextDraft(null);
    setTextValue('');
  };

  const onTextKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Enter inserts a newline (default <textarea> behaviour) — commit happens
    // on blur (click outside). Esc cancels the whole draft.
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelText();
    }
  };

  const onTextResizeSync = () => {
    const el = textInputRef.current;
    if (!el || !textDraft) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w !== textDraft.screenW || h !== textDraft.screenH) {
      setTextDraft({ ...textDraft, screenW: w, screenH: h });
    }
  };

  const cursorClass = useMemo(() => {
    if (tool === 'select') return 'cursor-default';
    if (tool === 'text') return 'cursor-text';
    if (tool === 'eraser') return 'cursor-cell';
    return 'cursor-crosshair';
  }, [tool]);

  const previewShapes = useMemo(() => {
    let base = shapes;
    if (drag && (drag.dx !== 0 || drag.dy !== 0)) {
      base = base.map((s) => (s.id === drag.shapeId ? translateShape(s, drag.dx, drag.dy) : s));
    }
    const extra: Shape[] = [];
    if (drawing) extra.push(drawing);
    if (curveDraft) extra.push(curveDraftToShape(curveDraft, settings.color, settings.strokeWidth));
    return extra.length ? [...base, ...extra] : base;
  }, [shapes, drag, drawing, curveDraft, settings.color, settings.strokeWidth]);

  const curveHandle =
    curveDraft?.phase === 'handle' ? { x: curveDraft.cx, y: curveDraft.cy } : null;

  return {
    previewShapes,
    cropDraft,
    cropPending,
    applyCrop,
    cancelCrop,
    textDraft,
    textValue,
    setTextValue,
    textInputRef,
    onTextKeyDown,
    onTextResizeSync,
    commitText,
    selectedId,
    cursorClass,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    curveHandle,
  };
}
