import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CanvasStage } from './CanvasStage';
import {
  blobFromCanvas,
  canRedo,
  canUndo,
  cropImage,
  downloadPng,
  exportPng,
  initHistory,
  pushHistory,
  redoHistory,
  resetHistory,
  translateShapesForCrop,
  undoHistory,
  type CropRect,
  type HistoryState,
  type ScreenshotCaptureResponse,
  type Shape,
} from './logic';
import { Toolbar } from './Toolbar';
import {
  DEFAULT_SETTINGS,
  useCanvasInteractions,
  type ArrowVariant,
  type CanvasSettings,
  type RectVariant,
  type Tool,
} from './useCanvasInteractions';

export default function ScreenshotTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:screenshot.ui.${k}`, opts);

  const [history, setHistory] = useState<HistoryState | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [arrowVariant, setArrowVariant] = useState<ArrowVariant>('single');
  const [rectVariant, setRectVariant] = useState<RectVariant>('rect');
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const snapshot = history ? history.entries[history.index] : null;
  const imgUrl = snapshot?.imgUrl ?? null;
  const shapes = snapshot?.shapes ?? [];

  // Load image when the current snapshot's URL changes.
  useEffect(() => {
    if (!imgUrl) {
      setImg(null);
      return;
    }
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = imgUrl;
  }, [imgUrl]);

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
      setHistory(initHistory(response.dataUrl));
      setTool('select');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const commitShapes = (next: Shape[]) => {
    if (!history || imgUrl === null) return;
    setHistory(pushHistory(history, { imgUrl, shapes: next }));
  };

  const commitCrop = (rect: CropRect) => {
    if (!history || !canvasRef.current) return;
    const nextImgUrl = cropImage(canvasRef.current, rect);
    const nextShapes = translateShapesForCrop(shapes, rect);
    setHistory(pushHistory(history, { imgUrl: nextImgUrl, shapes: nextShapes }));
  };

  const undo = () => setHistory((h) => (h ? undoHistory(h) : h));
  const redo = () => setHistory((h) => (h ? redoHistory(h) : h));
  const reset = () => setHistory((h) => (h ? resetHistory(h) : h));

  const updateSettings = (patch: Partial<CanvasSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const interactions = useCanvasInteractions({
    img,
    canvasRef,
    wrapperRef,
    tool,
    arrowVariant,
    rectVariant,
    settings,
    shapes,
    onCommitShapes: commitShapes,
    onApplyCrop: commitCrop,
  });

  const download = () => {
    if (canvasRef.current) downloadPng(canvasRef.current, `qakit-${Date.now()}.png`);
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

      {imgUrl && history && (
        <>
          <Toolbar
            tool={tool}
            onToolChange={setTool}
            arrowVariant={arrowVariant}
            onArrowVariantChange={setArrowVariant}
            rectVariant={rectVariant}
            onRectVariantChange={setRectVariant}
            settings={settings}
            onSettingsChange={updateSettings}
            canUndo={canUndo(history)}
            canRedo={canRedo(history)}
            onUndo={undo}
            onRedo={redo}
            onReset={reset}
          />

          <CanvasStage
            img={img}
            previewShapes={interactions.previewShapes}
            cropDraft={interactions.cropDraft}
            cropPending={interactions.cropPending}
            onApplyCrop={interactions.applyCrop}
            onCancelCrop={interactions.cancelCrop}
            selectedId={interactions.selectedId}
            curveHandle={interactions.curveHandle}
            cursorClass={interactions.cursorClass}
            canvasRef={canvasRef}
            wrapperRef={wrapperRef}
            onPointerDown={interactions.onPointerDown}
            onPointerMove={interactions.onPointerMove}
            onPointerUp={interactions.onPointerUp}
            textDraft={interactions.textDraft}
            textValue={interactions.textValue}
            onTextValueChange={interactions.setTextValue}
            onTextKeyDown={interactions.onTextKeyDown}
            onTextBlur={interactions.commitText}
            onTextResizeSync={interactions.onTextResizeSync}
            textInputRef={interactions.textInputRef}
            textPlaceholder={ui('textPlaceholder')}
            applyLabel={t('common:actions.apply')}
            cancelLabel={t('common:actions.cancel')}
            settings={settings}
          />
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
