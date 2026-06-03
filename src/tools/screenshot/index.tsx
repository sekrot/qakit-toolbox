import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Camera,
  Check,
  Copy,
  Crop,
  Download,
  Highlighter,
  Minus,
  MousePointer,
  Pencil,
  Square,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  blobFromCanvas,
  cropImage,
  downloadPng,
  drawShapes,
  exportPng,
  findShapeAt,
  makeId,
  normaliseRect,
  PALETTE,
  shapeBBox,
  translateShape,
  translateShapesForCrop,
  type CropRect,
  type ScreenshotCaptureResponse,
  type Shape,
} from './logic';

type Tool = 'select' | 'rect' | 'highlight' | 'arrow' | 'line' | 'pen' | 'text' | 'crop';

const TOOLS: { value: Tool; icon: typeof Square }[] = [
  { value: 'select', icon: MousePointer },
  { value: 'rect', icon: Square },
  { value: 'highlight', icon: Highlighter },
  { value: 'arrow', icon: ArrowUpRight },
  { value: 'line', icon: Minus },
  { value: 'pen', icon: Pencil },
  { value: 'text', icon: Type },
  { value: 'crop', icon: Crop },
];

interface TextDraft {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

interface DragState {
  shapeId: string;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
}

export default function ScreenshotTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:screenshot.ui.${k}`, opts);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState(PALETTE[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawing, setDrawing] = useState<Shape | null>(null);
  const [cropDraft, setCropDraft] = useState<CropRect | null>(null);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const fontSize = Math.max(16, strokeWidth * 8);

  // Load image when URL changes
  useEffect(() => {
    if (!imgUrl) {
      setImg(null);
      return;
    }
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = imgUrl;
  }, [imgUrl]);

  // Redraw on any state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawShapes(ctx, drawing ? [...shapes, drawing] : shapes);
    if (cropDraft) drawCropOverlay(ctx, cropDraft);
    if (selectedId) {
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel) drawSelectionMarker(ctx, sel);
    }
  }, [img, shapes, drawing, cropDraft, selectedId]);

  // Focus inline text input when it appears (in addition to autoFocus attribute,
  // belt-and-suspenders so it survives React strict-mode double-invoke).
  useEffect(() => {
    if (textDraft) {
      const id = window.setTimeout(() => textInputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [textDraft]);

  const capture = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'capture-visible-tab',
      })) as ScreenshotCaptureResponse;
      if (!response?.ok || !response.dataUrl) {
        setError(response?.error ?? ui('captureFailed'));
        return;
      }
      setImgUrl(response.dataUrl);
      setShapes([]);
      setCropDraft(null);
      setTextDraft(null);
      setSelectedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

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

    if (tool === 'select') {
      const hit = findShapeAt(shapes, x, y);
      if (hit) {
        setSelectedId(hit.id);
        // Use the bbox top-left as the origin to translate relative to.
        const b = shapeBBox(hit);
        setDrag({ shapeId: hit.id, originX: b.left, originY: b.top, startX: x, startY: y });
      } else {
        setSelectedId(null);
      }
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
      });
      return;
    }

    if (tool === 'crop') {
      setCropDraft({ x, y, w: 0, h: 0 });
      return;
    }

    setSelectedId(null);
    if (tool === 'rect') {
      setDrawing({ id: makeId(), kind: 'rect', color, strokeWidth, x, y, w: 0, h: 0 });
    } else if (tool === 'highlight') {
      setDrawing({ id: makeId(), kind: 'highlight', color, strokeWidth, x, y, w: 0, h: 0 });
    } else if (tool === 'line') {
      setDrawing({ id: makeId(), kind: 'line', color, strokeWidth, x1: x, y1: y, x2: x, y2: y });
    } else if (tool === 'arrow') {
      setDrawing({ id: makeId(), kind: 'arrow', color, strokeWidth, x1: x, y1: y, x2: x, y2: y });
    } else if (tool === 'pen') {
      setDrawing({ id: makeId(), kind: 'pen', color, strokeWidth, points: [{ x, y }] });
    }
  };

  const onPointerMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (drag && tool === 'select' && e.buttons === 1) {
      const { x, y } = toCanvasCoords(e);
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== drag.shapeId) return s;
          const b = shapeBBox(s);
          // Translate relative to original drag-start position
          return translateShape(s, drag.originX + dx - b.left, drag.originY + dy - b.top);
        }),
      );
      return;
    }
    if (cropDraft && tool === 'crop' && e.buttons === 1) {
      const { x, y } = toCanvasCoords(e);
      setCropDraft({ ...cropDraft, w: x - cropDraft.x, h: y - cropDraft.y });
      return;
    }
    if (!drawing) return;
    const { x, y } = toCanvasCoords(e);
    if (drawing.kind === 'rect' || drawing.kind === 'highlight') {
      setDrawing({ ...drawing, w: x - drawing.x, h: y - drawing.y });
    } else if (drawing.kind === 'arrow' || drawing.kind === 'line') {
      setDrawing({ ...drawing, x2: x, y2: y });
    } else if (drawing.kind === 'pen') {
      // Append a point if it's moved enough — keeps the data lean.
      const last = drawing.points[drawing.points.length - 1];
      if (Math.hypot(x - last.x, y - last.y) >= 1.5) {
        setDrawing({ ...drawing, points: [...drawing.points, { x, y }] });
      }
    }
  };

  const onPointerUp = () => {
    setDrag(null);
    if (drawing) {
      setShapes((prev) => [...prev, drawing]);
      setDrawing(null);
    }
  };

  const undo = () => {
    setShapes((prev) => prev.slice(0, -1));
    setSelectedId(null);
  };
  const clear = () => {
    setShapes([]);
    setSelectedId(null);
  };
  const deleteSelected = () => {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

  const download = () => {
    if (canvasRef.current) downloadPng(canvasRef.current, `devkit-${Date.now()}.png`);
  };

  const copy = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await blobFromCanvas(canvasRef.current);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      try {
        await navigator.clipboard.writeText(exportPng(canvasRef.current!));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        setError(e instanceof Error ? e.message : ui('copyImageFailed'));
      }
    }
  };

  const applyCrop = () => {
    if (!cropDraft || !canvasRef.current) return;
    const normalised = normaliseRect(cropDraft);
    if (normalised.w < 4 || normalised.h < 4) {
      setCropDraft(null);
      return;
    }
    const composed = canvasRef.current;
    const next = cropImage(composed, normalised);
    setShapes((prev) => translateShapesForCrop(prev, normalised));
    setImgUrl(next);
    setCropDraft(null);
    setSelectedId(null);
  };

  const commitText = () => {
    if (!textDraft) return;
    const value = textValue.trim();
    if (value) {
      setShapes((prev) => [
        ...prev,
        {
          id: makeId(),
          kind: 'text',
          color,
          strokeWidth,
          x: textDraft.x,
          y: textDraft.y,
          text: value,
          fontSize,
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

  const onTextKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitText();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelText();
    }
  };

  const cursorClass = useMemo(() => {
    if (tool === 'select') return 'cursor-default';
    if (tool === 'text') return 'cursor-text';
    return 'cursor-crosshair';
  }, [tool]);

  const cropPending =
    tool === 'crop' && cropDraft && Math.abs(cropDraft.w) >= 4 && Math.abs(cropDraft.h) >= 4;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={capture} disabled={busy} size="sm">
          <Camera className="h-3 w-3" />
          {busy ? ui('capturing') : imgUrl ? ui('recapture') : ui('capture')}
        </Button>
        {imgUrl && (
          <>
            <Button variant="secondary" size="sm" onClick={download}>
              <Download className="h-3 w-3" />
              {ui('png')}
            </Button>
            <Button variant="secondary" size="sm" onClick={copy}>
              <Copy className="h-3 w-3" />
              {copied ? t('common:copied') : t('common:copy')}
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {imgUrl && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-0.5">
              {TOOLS.map((toolDef) => {
                const Icon = toolDef.icon;
                const label = ui(`tools.${toolDef.value}`);
                return (
                  <button
                    key={toolDef.value}
                    onClick={() => {
                      setTool(toolDef.value);
                      setCropDraft(null);
                      cancelText();
                      if (toolDef.value !== 'select') setSelectedId(null);
                    }}
                    title={label}
                    aria-label={label}
                    className={cn(
                      'rounded-md border p-1.5 transition-colors',
                      tool === toolDef.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>

            <div className="flex gap-0.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-6 w-6 rounded-md border',
                    color === c ? 'border-foreground ring-2 ring-primary' : 'border-border',
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                  aria-label={ui('colorAria', { color: c })}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">{t('common:labels.size')}</span>
              <input
                type="range"
                min={1}
                max={12}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                aria-label={ui('strokeAria')}
                className="w-16"
              />
              <span className="w-5 font-mono">{strokeWidth}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {cropPending ? (
                <>
                  <Button variant="primary" size="sm" onClick={applyCrop}>
                    <Check className="h-3 w-3" />
                    {t('common:actions.apply')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCropDraft(null)}>
                    <X className="h-3 w-3" />
                    {t('common:actions.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  {selectedId && (
                    <Button variant="ghost" size="sm" onClick={deleteSelected}>
                      <X className="h-3 w-3" />
                      {t('common:actions.delete')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={undo} disabled={shapes.length === 0}>
                    <Undo2 className="h-3 w-3" />
                    {t('common:actions.undo')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clear} disabled={shapes.length === 0}>
                    <Trash2 className="h-3 w-3" />
                    {t('common:clear')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {tool === 'select' && (
            <p className="text-[10px] text-muted-foreground">{ui('selectHint')}</p>
          )}

          <div
            ref={wrapperRef}
            className="relative flex-1 overflow-auto rounded-md border border-border bg-muted/40 p-1"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              className={cn('max-w-full', cursorClass)}
            />
            {textDraft && (
              <input
                ref={textInputRef}
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={onTextKeyDown}
                placeholder={ui('textPlaceholder')}
                className="absolute rounded-sm border border-primary bg-background/95 px-1 outline-none"
                style={{
                  left: textDraft.screenX,
                  top: textDraft.screenY,
                  color,
                  fontSize: `${fontSize * (canvasRef.current ? canvasRef.current.getBoundingClientRect().width / canvasRef.current.width : 1)}px`,
                  fontWeight: 700,
                  minWidth: 100,
                }}
              />
            )}
          </div>
        </>
      )}

      {!imgUrl && (
        <p
          className="text-center text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: ui('emptyHint') }}
        />
      )}
    </div>
  );
}

function drawCropOverlay(ctx: CanvasRenderingContext2D, draft: CropRect) {
  const r = normaliseRect(draft);
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, ctx.canvas.width, r.y);
  ctx.fillRect(0, r.y + r.h, ctx.canvas.width, ctx.canvas.height - (r.y + r.h));
  ctx.fillRect(0, r.y, r.x, r.h);
  ctx.fillRect(r.x + r.w, r.y, ctx.canvas.width - (r.x + r.w), r.h);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}

/** Dashed bounding box around the currently selected shape. */
function drawSelectionMarker(ctx: CanvasRenderingContext2D, shape: Shape) {
  const b = shapeBBox(shape);
  const pad = 4;
  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(b.left - pad, b.top - pad, b.right - b.left + pad * 2, b.bottom - b.top + pad * 2);
  ctx.restore();
}
