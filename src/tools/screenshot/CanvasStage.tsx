import {
  useEffect,
  useLayoutEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  canvasRectToScreenRect,
  clampFloatingPosition,
  drawShapes,
  normaliseRect,
  resolveFontStack,
  shapeBBox,
  type CropRect,
  type Shape,
} from './logic';
import type { CanvasSettings, TextDraft } from './useCanvasInteractions';

const CROP_BUTTONS_W = 76;
const CROP_BUTTONS_H = 36;

interface CanvasStageProps {
  img: HTMLImageElement | null;
  previewShapes: Shape[];
  cropDraft: CropRect | null;
  cropPending: boolean;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  selectedId: string | null;
  curveHandle: { x: number; y: number } | null;
  cursorClass: string;
  canvasRef: RefObject<HTMLCanvasElement>;
  wrapperRef: RefObject<HTMLDivElement>;
  onPointerDown: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: ReactMouseEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
  textDraft: TextDraft | null;
  textValue: string;
  onTextValueChange: (v: string) => void;
  onTextKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onTextBlur: () => void;
  onTextResizeSync: () => void;
  textInputRef: RefObject<HTMLTextAreaElement>;
  textPlaceholder: string;
  applyLabel: string;
  cancelLabel: string;
  settings: CanvasSettings;
}

export function CanvasStage({
  img,
  previewShapes,
  cropDraft,
  cropPending,
  onApplyCrop,
  onCancelCrop,
  selectedId,
  curveHandle,
  cursorClass,
  canvasRef,
  wrapperRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  textDraft,
  textValue,
  onTextValueChange,
  onTextKeyDown,
  onTextBlur,
  onTextResizeSync,
  textInputRef,
  textPlaceholder,
  applyLabel,
  cancelLabel,
  settings,
}: CanvasStageProps) {
  const [cropButtonsPos, setCropButtonsPos] = useState<{ left: number; top: number } | null>(null);

  // Redraw on any state change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawShapes(ctx, previewShapes);
    if (cropDraft) drawCropOverlay(ctx, cropDraft);
    if (selectedId) {
      const sel = previewShapes.find((s) => s.id === selectedId);
      if (sel) drawSelectionMarker(ctx, sel);
    }
    if (curveHandle) drawCurveHandle(ctx, curveHandle);
  }, [img, previewShapes, cropDraft, selectedId, curveHandle, canvasRef]);

  // Position the floating crop Apply/Cancel buttons just below (or, if that would
  // overflow, above) the crop selection — relative to the wrapper, which scrolls
  // together with the canvas so no scroll-offset math is needed.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!cropPending || !cropDraft || !canvas || !wrapper) {
      setCropButtonsPos(null);
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    const screenRect = canvasRectToScreenRect(
      cropDraft,
      { w: canvas.width, h: canvas.height },
      { w: canvasRect.width, h: canvasRect.height },
    );
    const desiredLeft =
      canvas.offsetLeft + screenRect.left + screenRect.width / 2 - CROP_BUTTONS_W / 2;
    let desiredTop = canvas.offsetTop + screenRect.top + screenRect.height + 8;
    if (desiredTop + CROP_BUTTONS_H > canvas.offsetTop + canvas.clientHeight) {
      desiredTop = canvas.offsetTop + screenRect.top - CROP_BUTTONS_H - 8;
    }
    const bounds = {
      w: wrapper.clientWidth,
      h: Math.max(wrapper.scrollHeight, wrapper.clientHeight),
    };
    setCropButtonsPos(
      clampFloatingPosition(
        { left: desiredLeft, top: desiredTop },
        { w: CROP_BUTTONS_W, h: CROP_BUTTONS_H },
        bounds,
      ),
    );
  }, [cropPending, cropDraft, canvasRef, wrapperRef]);

  return (
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
        <textarea
          ref={textInputRef}
          value={textValue}
          onChange={(e) => onTextValueChange(e.target.value)}
          onKeyDown={onTextKeyDown}
          onBlur={onTextBlur}
          onMouseUp={onTextResizeSync}
          placeholder={textPlaceholder}
          className="absolute resize overflow-hidden rounded-sm border border-primary bg-background/95 px-1 py-0.5 outline-none"
          style={{
            left: textDraft.screenX,
            top: textDraft.screenY,
            width: textDraft.screenW,
            height: textDraft.screenH,
            color: settings.color,
            fontFamily: resolveFontStack(settings.fontFamily),
            fontSize: `${settings.fontSize * (canvasRef.current ? canvasRef.current.getBoundingClientRect().width / canvasRef.current.width : 1)}px`,
            lineHeight: 1.25,
            fontWeight: settings.bold ? 700 : 400,
            fontStyle: settings.italic ? 'italic' : 'normal',
            textDecoration: settings.underline ? 'underline' : 'none',
          }}
        />
      )}
      {cropPending && cropButtonsPos && (
        <div
          className="absolute z-10 flex gap-1"
          style={{ left: cropButtonsPos.left, top: cropButtonsPos.top }}
        >
          <Button
            variant="primary"
            size="icon"
            onClick={onApplyCrop}
            aria-label={applyLabel}
            title={applyLabel}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelCrop}
            aria-label={cancelLabel}
            title={cancelLabel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
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

function drawCurveHandle(ctx: CanvasRenderingContext2D, handle: { x: number; y: number }) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
