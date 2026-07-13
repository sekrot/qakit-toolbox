import { Bold, Italic, Underline } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Slider } from '@/components/ui/Slider';
import { FONT_STACKS, type TextFontFamily } from './logic';
import type { ArrowVariant, CanvasSettings, RectVariant, Tool } from './useCanvasInteractions';

interface ToolSettingsPanelProps {
  tool: Tool;
  arrowVariant: ArrowVariant;
  rectVariant: RectVariant;
  settings: CanvasSettings;
  onSettingsChange: (patch: Partial<CanvasSettings>) => void;
}

/** Pure switch on the active tool — renders exactly the settings that tool needs. */
export function ToolSettingsPanel({ tool, settings, onSettingsChange }: ToolSettingsPanelProps) {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:screenshot.ui.${k}`, opts);

  const colorPicker = (
    <ColorPicker
      value={settings.color}
      onChange={(c) => onSettingsChange({ color: c })}
      swatchAriaLabel={(c) => ui('colorAria', { color: c })}
      customAriaLabel={ui('settings.customColor')}
      hexLabel={ui('settings.hexLabel')}
    />
  );

  const strokeSlider = (
    <Slider
      label={t('common:labels.size')}
      value={settings.strokeWidth}
      min={1}
      max={12}
      onChange={(n) => onSettingsChange({ strokeWidth: n })}
      aria-label={ui('strokeAria')}
    />
  );

  switch (tool) {
    case 'pen':
    case 'marker':
    case 'arrow':
    case 'rect':
      return (
        <div className="flex flex-wrap items-center gap-2">
          {colorPicker}
          {strokeSlider}
        </div>
      );
    case 'highlight':
      return <div className="flex flex-wrap items-center gap-2">{colorPicker}</div>;
    case 'blur':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Slider
            label={ui('settings.blurStrength')}
            value={settings.blurIntensity}
            min={4}
            max={40}
            onChange={(n) => onSettingsChange({ blurIntensity: n })}
          />
        </div>
      );
    case 'stepNumber':
      return (
        <div className="flex flex-wrap items-center gap-2">
          {colorPicker}
          <Slider
            label={t('common:labels.size')}
            value={settings.stepSize}
            min={16}
            max={56}
            onChange={(n) => onSettingsChange({ stepSize: n })}
          />
        </div>
      );
    case 'emoji':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Slider
            label={t('common:labels.size')}
            value={settings.emojiSize}
            min={16}
            max={64}
            onChange={(n) => onSettingsChange({ emojiSize: n })}
          />
        </div>
      );
    case 'text':
      return (
        <div className="flex flex-wrap items-center gap-2">
          {colorPicker}
          <select
            value={settings.fontFamily}
            onChange={(e) => onSettingsChange({ fontFamily: e.target.value as TextFontFamily })}
            aria-label={ui('settings.fontFamily')}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            {FONT_STACKS.map((f) => (
              <option key={f.id} value={f.id}>
                {ui(`settings.fontFamily${f.id.charAt(0).toUpperCase()}${f.id.slice(1)}`)}
              </option>
            ))}
          </select>
          <Slider
            label={t('common:labels.size')}
            value={settings.fontSize}
            min={12}
            max={64}
            onChange={(n) => onSettingsChange({ fontSize: n })}
          />
          <div className="flex gap-0.5">
            <Button
              type="button"
              size="icon"
              variant={settings.bold ? 'primary' : 'ghost'}
              onClick={() => onSettingsChange({ bold: !settings.bold })}
              aria-label={ui('settings.bold')}
              title={ui('settings.bold')}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={settings.italic ? 'primary' : 'ghost'}
              onClick={() => onSettingsChange({ italic: !settings.italic })}
              aria-label={ui('settings.italic')}
              title={ui('settings.italic')}
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={settings.underline ? 'primary' : 'ghost'}
              onClick={() => onSettingsChange({ underline: !settings.underline })}
              aria-label={ui('settings.underline')}
              title={ui('settings.underline')}
            >
              <Underline className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      );
    case 'select':
      return <p className="text-[10px] text-muted-foreground">{ui('selectHint')}</p>;
    case 'eraser':
      return <p className="text-[10px] text-muted-foreground">{ui('eraserHint')}</p>;
    case 'crop':
      return null;
  }
}
