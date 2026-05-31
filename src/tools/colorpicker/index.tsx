import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Pipette, Pin, PinOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { getValue, setValue } from '@/storage/storage';
import {
  formatCmyk,
  formatHsl,
  formatHsla,
  formatRgb,
  formatRgba,
  isEyeDropperSupported,
  parseHex,
  pickColor,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
} from './logic';

const HISTORY_KEY = 'colorpicker.history';
const HISTORY_LIMIT = 20;

interface HistoryItem {
  hex: string;
  pinned: boolean;
  ts: number;
}

export default function ColorPickerTool() {
  const { t } = useTranslation('common');
  const [hex, setHex] = useState('#ff8800');
  const [hexInput, setHexInput] = useState('#ff8800');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const supported = isEyeDropperSupported();

  useEffect(() => {
    void getValue<HistoryItem[]>(HISTORY_KEY, [])
      .then(setHistory)
      .catch(() => undefined);
  }, []);

  const persist = (next: HistoryItem[]) => {
    setHistory(next);
    void setValue(HISTORY_KEY, next);
  };

  const apply = (value: string) => {
    const rgb = parseHex(value);
    if (!rgb) {
      setError('Invalid hex color');
      return;
    }
    setError(null);
    const canonical = rgbToHex(rgb);
    setHex(canonical);
    setHexInput(canonical);
  };

  const pushHistory = (value: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.hex !== value);
      const next = [{ hex: value, pinned: false, ts: Date.now() }, ...filtered];
      const pinned = next.filter((i) => i.pinned);
      const unpinned = next.filter((i) => !i.pinned).slice(0, HISTORY_LIMIT - pinned.length);
      const trimmed = [...pinned, ...unpinned];
      void setValue(HISTORY_KEY, trimmed);
      return trimmed;
    });
  };

  const onPick = async () => {
    const picked = await pickColor();
    if (picked) {
      apply(picked);
      pushHistory(picked.toLowerCase());
    }
  };

  const togglePin = (target: string) => {
    persist(history.map((i) => (i.hex === target ? { ...i, pinned: !i.pinned } : i)));
  };

  const removeItem = (target: string) => {
    persist(history.filter((i) => i.hex !== target));
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const rgb = parseHex(hex)!;
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);

  const formats: { label: string; value: string }[] = [
    { label: 'HEX', value: hex },
    { label: 'RGB', value: formatRgb(rgb) },
    { label: 'RGBA', value: formatRgba(rgb, 1) },
    { label: 'HSL', value: formatHsl(hsl) },
    { label: 'HSLA', value: formatHsla(hsl, 1) },
    { label: 'CMYK', value: formatCmyk(cmyk) },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <div
          className="h-16 w-16 flex-shrink-0 rounded-md border border-border"
          style={{ backgroundColor: hex }}
          aria-label="Color preview"
        />
        <div className="flex flex-1 flex-col gap-1">
          <Input
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              if (parseHex(e.target.value)) apply(e.target.value);
              else setError(null);
            }}
            placeholder="#ff8800"
            className="font-mono"
          />
          <Button onClick={onPick} disabled={!supported} size="sm">
            <Pipette className="h-3 w-3" />
            {supported ? 'Pick color from screen' : 'EyeDropper not supported'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-2">
        {formats.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="w-14 text-muted-foreground">{f.label}</span>
            <code className="flex-1 truncate font-mono">{f.value}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(f.value, f.label)}
              className="h-6 w-6 p-0"
            >
              {copied === f.label ? (
                <span className="text-[10px]">{t('copied')}</span>
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          History
        </h3>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => persist(history.filter((i) => i.pinned))}
          >
            Clear unpinned
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 overflow-y-auto">
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Pick or paste a color to populate history.
          </p>
        )}
        {history.map((item) => (
          <div
            key={item.hex}
            role="button"
            tabIndex={0}
            className={cn(
              'group relative h-10 w-10 cursor-pointer rounded-md border border-border outline-none focus-visible:ring-2 focus-visible:ring-primary',
              item.pinned && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
            )}
            style={{ backgroundColor: item.hex }}
            title={item.hex}
            aria-label={`Use ${item.hex}`}
            onClick={() => apply(item.hex)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                apply(item.hex);
              }
            }}
          >
            <div className="invisible absolute -right-1 -top-1 flex gap-0.5 group-hover:visible">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(item.hex);
                }}
                className="rounded-full bg-background p-0.5 shadow"
                aria-label={item.pinned ? 'Unpin' : 'Pin'}
              >
                {item.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.hex);
                }}
                className="rounded-full bg-background p-0.5 shadow"
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
