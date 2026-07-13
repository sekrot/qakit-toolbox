import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { PALETTE } from '@/lib/palette';
import { parseHex, rgbToHex } from '@/tools/colorpicker/logic';
import { Input } from './Input';
import { Popover } from './Popover';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  palette?: string[];
  swatchAriaLabel?: (hex: string) => string;
  customAriaLabel?: string;
  hexLabel?: string;
  className?: string;
}

/** Shared color control: the fixed palette swatches plus one trigger swatch that
 * opens a native color input + validated hex field for arbitrary colors. */
export function ColorPicker({
  value,
  onChange,
  palette = PALETTE,
  swatchAriaLabel,
  customAriaLabel = 'Custom color',
  hexLabel = 'Hex',
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isCustom = !palette.includes(value);

  const applyHex = (raw: string) => {
    setHexInput(raw);
    const rgb = parseHex(raw);
    if (rgb) onChange(rgbToHex(rgb));
  };

  return (
    <div className={cn('flex gap-0.5', className)}>
      {palette.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'h-6 w-6 rounded-md border',
            value === c ? 'border-foreground ring-2 ring-primary' : 'border-border',
          )}
          style={{ backgroundColor: c }}
          title={c}
          aria-label={swatchAriaLabel ? swatchAriaLabel(c) : c}
        />
      ))}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setHexInput(value);
          setOpen((o) => !o);
        }}
        className={cn(
          'h-6 w-6 rounded-md border bg-[conic-gradient(from_90deg,red,yellow,lime,cyan,blue,magenta,red)]',
          isCustom ? 'border-foreground ring-2 ring-primary' : 'border-border',
        )}
        title={customAriaLabel}
        aria-label={customAriaLabel}
      />
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} align="end">
        <div className="flex items-center gap-2 p-1">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
            aria-label={customAriaLabel}
          />
          <Input
            value={hexInput}
            onChange={(e) => applyHex(e.target.value)}
            placeholder={hexLabel}
            className="h-8 w-24 font-mono text-xs"
            aria-label={hexLabel}
          />
        </div>
      </Popover>
    </div>
  );
}
