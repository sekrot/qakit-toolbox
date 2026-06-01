import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Camera,
  Copy,
  Download,
  MousePointer,
  Square,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  blobFromCanvas,
  downloadPng,
  drawShapes,
  exportPng,
  makeId,
  PALETTE,
  type Shape,
  type ScreenshotCaptureResponse,
} from './logic';

type Tool = 'select' | 'rect' | 'arrow' | 'text';

const TOOLS: { value: Tool; label: string; icon: typeof Square }[] = [
  { value: 'select', label: 'Select', icon: MousePointer },
  { value: 'rect', label: 'Rectangle', icon: Square },
  { value: 'arrow', label: 'Arrow', icon: ArrowUpRight },
  { value: 'text', label: 'Text', icon: Type },
];

export default function ScreenshotTool() {
  const { t } = useTranslation('common');
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState(PALETTE[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawing, setDrawing] = useState<Shape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  }, [img, shapes, drawing]);

  const capture = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'capture-visible-tab',
      })) as ScreenshotCaptureResponse;
      if (!response?.ok || !response.dataUrl) {
        setError(response?.error ?? 'Capture failed');
        return;
      }
      setImgUrl(response.dataUrl);
      setShapes([]);
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
    if (!img || tool === 'select') return;
    const { x, y } = toCanvasCoords(e);
    if (tool === 'text') {
      const text = window.prompt('Annotation text');
      if (!text) return;
      setShapes((prev) => [
        ...prev,
        {
          id: makeId(),
          kind: 'text',
          color,
          strokeWidth,
          x,
          y,
          text,
          fontSize: Math.max(16, strokeWidth * 8),
        },
      ]);
      return;
    }
    if (tool === 'rect') {
      setDrawing({ id: makeId(), kind: 'rect', color, strokeWidth, x, y, w: 0, h: 0 });
    } else {
      setDrawing({ id: makeId(), kind: 'arrow', color, strokeWidth, x1: x, y1: y, x2: x, y2: y });
    }
  };

  const onPointerMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const { x, y } = toCanvasCoords(e);
    if (drawing.kind === 'rect') {
      setDrawing({ ...drawing, w: x - drawing.x, h: y - drawing.y });
    } else if (drawing.kind === 'arrow') {
      setDrawing({ ...drawing, x2: x, y2: y });
    }
  };

  const onPointerUp = () => {
    if (drawing) {
      setShapes((prev) => [...prev, drawing]);
      setDrawing(null);
    }
  };

  const undo = () => setShapes((prev) => prev.slice(0, -1));
  const clear = () => setShapes([]);

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
      // Fallback: copy data URL as text
      try {
        await navigator.clipboard.writeText(exportPng(canvasRef.current!));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        setError(e instanceof Error ? e.message : 'Failed to copy image');
      }
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={capture} disabled={busy} size="sm">
          <Camera className="h-3 w-3" />
          {busy ? 'Capturing…' : imgUrl ? 'Recapture' : 'Capture tab'}
        </Button>
        {imgUrl && (
          <>
            <Button variant="secondary" size="sm" onClick={download}>
              <Download className="h-3 w-3" />
              PNG
            </Button>
            <Button variant="secondary" size="sm" onClick={copy}>
              <Copy className="h-3 w-3" />
              {copied ? t('copied') : 'Copy'}
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
              {TOOLS.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.value}
                    onClick={() => setTool(it.value)}
                    title={it.label}
                    aria-label={it.label}
                    className={cn(
                      'rounded-md border p-1.5 transition-colors',
                      tool === it.value
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
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Size</span>
              <input
                type="range"
                min={1}
                max={12}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                aria-label="Stroke width"
                className="w-16"
              />
              <span className="w-5 font-mono">{strokeWidth}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={undo} disabled={shapes.length === 0}>
                <Undo2 className="h-3 w-3" />
                Undo
              </Button>
              <Button variant="ghost" size="sm" onClick={clear} disabled={shapes.length === 0}>
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-md border border-border bg-muted/40 p-1">
            <canvas
              ref={canvasRef}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              className={cn(
                'max-w-full',
                tool === 'select' ? 'cursor-default' : 'cursor-crosshair',
              )}
            />
          </div>
        </>
      )}

      {!imgUrl && (
        <p className="text-center text-xs text-muted-foreground">
          Click <strong>Capture tab</strong> to take a screenshot of the active tab and start
          annotating.
        </p>
      )}
    </div>
  );
}
