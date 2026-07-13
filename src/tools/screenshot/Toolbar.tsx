import {
  ArrowRightLeft,
  ArrowUpRight,
  Blend,
  Circle,
  Crop,
  Eraser,
  Lasso,
  ListOrdered,
  Minus,
  MousePointer,
  PaintBucket,
  Pencil,
  Redo2,
  RotateCcw,
  Smile,
  Spline,
  Square,
  Type,
  Undo2,
  Highlighter,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';
import { cn } from '@/lib/cn';
import { ToolSettingsPanel } from './ToolSettingsPanel';
import type { ArrowVariant, CanvasSettings, RectVariant, Tool } from './useCanvasInteractions';

const TOOLS: { value: Tool; icon: typeof Square }[] = [
  { value: 'select', icon: MousePointer },
  { value: 'pen', icon: Pencil },
  { value: 'marker', icon: Highlighter },
  { value: 'eraser', icon: Eraser },
  { value: 'text', icon: Type },
  { value: 'arrow', icon: ArrowUpRight },
  { value: 'rect', icon: Square },
  { value: 'highlight', icon: PaintBucket },
  { value: 'blur', icon: Blend },
  { value: 'crop', icon: Crop },
  { value: 'stepNumber', icon: ListOrdered },
  { value: 'emoji', icon: Smile },
];

const ARROW_VARIANTS: { value: ArrowVariant; icon: typeof Square }[] = [
  { value: 'single', icon: ArrowUpRight },
  { value: 'double', icon: ArrowRightLeft },
  { value: 'line', icon: Minus },
  { value: 'curve', icon: Spline },
];

const RECT_VARIANTS: { value: RectVariant; icon: typeof Square }[] = [
  { value: 'rect', icon: Square },
  { value: 'ellipse', icon: Circle },
  { value: 'freeform', icon: Lasso },
];

const EMOJI_OPTIONS = [
  '😀',
  '😂',
  '😍',
  '😎',
  '🤔',
  '😭',
  '😡',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💪',
  '🔥',
  '⭐',
  '✅',
  '❌',
  '⚠️',
  '❓',
  '❗',
  '💡',
  '🎉',
  '❤️',
  '👀',
  '🚀',
];

interface ToolbarProps {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  arrowVariant: ArrowVariant;
  onArrowVariantChange: (v: ArrowVariant) => void;
  rectVariant: RectVariant;
  onRectVariantChange: (v: RectVariant) => void;
  settings: CanvasSettings;
  onSettingsChange: (patch: Partial<CanvasSettings>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
}

export function Toolbar({
  tool,
  onToolChange,
  arrowVariant,
  onArrowVariantChange,
  rectVariant,
  onRectVariantChange,
  settings,
  onSettingsChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
}: ToolbarProps) {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:screenshot.ui.${k}`, opts);
  const arrowBtnRef = useRef<HTMLButtonElement>(null);
  const rectBtnRef = useRef<HTMLButtonElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const [openPopover, setOpenPopover] = useState<'arrow' | 'rect' | 'emoji' | null>(null);

  const selectTool = (value: Tool) => {
    if (value === 'arrow' || value === 'rect' || value === 'emoji') {
      if (tool === value) {
        setOpenPopover((p) => (p === value ? null : value));
      } else {
        onToolChange(value);
        setOpenPopover(value);
      }
      return;
    }
    onToolChange(value);
    setOpenPopover(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-3 w-3" />
          {t('common:actions.undo')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-3 w-3" />
          {t('common:actions.redo')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={!canUndo}>
          <RotateCcw className="h-3 w-3" />
          {t('common:actions.reset')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-0.5">
        {TOOLS.map((toolDef) => {
          const Icon = toolDef.icon;
          const label = ui(`tools.${toolDef.value}`);
          const ref =
            toolDef.value === 'arrow'
              ? arrowBtnRef
              : toolDef.value === 'rect'
                ? rectBtnRef
                : toolDef.value === 'emoji'
                  ? emojiBtnRef
                  : undefined;
          return (
            <button
              key={toolDef.value}
              ref={ref}
              onClick={() => selectTool(toolDef.value)}
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

      <Popover
        open={openPopover === 'arrow'}
        onClose={() => setOpenPopover(null)}
        anchorRef={arrowBtnRef}
      >
        <div className="flex flex-col gap-0.5">
          {ARROW_VARIANTS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.value}
                onClick={() => {
                  onArrowVariantChange(v.value);
                  setOpenPopover(null);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent',
                  arrowVariant === v.value && 'bg-accent text-primary',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {ui(`arrowVariants.${v.value}`)}
              </button>
            );
          })}
        </div>
      </Popover>

      <Popover
        open={openPopover === 'rect'}
        onClose={() => setOpenPopover(null)}
        anchorRef={rectBtnRef}
      >
        <div className="flex flex-col gap-0.5">
          {RECT_VARIANTS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.value}
                onClick={() => {
                  onRectVariantChange(v.value);
                  setOpenPopover(null);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent',
                  rectVariant === v.value && 'bg-accent text-primary',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {ui(`rectVariants.${v.value}`)}
              </button>
            );
          })}
        </div>
      </Popover>

      <Popover
        open={openPopover === 'emoji'}
        onClose={() => setOpenPopover(null)}
        anchorRef={emojiBtnRef}
        align="center"
      >
        <div className="grid grid-cols-6 gap-0.5" role="listbox" aria-label={ui('emojiPickerAria')}>
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => {
                onSettingsChange({ emojiChar: e });
                setOpenPopover(null);
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-accent',
                settings.emojiChar === e && 'bg-accent ring-1 ring-primary',
              )}
              aria-label={e}
            >
              {e}
            </button>
          ))}
        </div>
      </Popover>

      <ToolSettingsPanel
        tool={tool}
        arrowVariant={arrowVariant}
        rectVariant={rectVariant}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
}
