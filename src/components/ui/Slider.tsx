import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type'
> {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, value, min, max, step = 1, onChange, formatValue, className, ...props }, ref) => (
    <div className="flex items-center gap-1.5 text-xs">
      {label && <span className="text-muted-foreground">{label}</span>}
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('w-16', className)}
        {...props}
      />
      <span className="w-6 font-mono">{formatValue ? formatValue(value) : value}</span>
    </div>
  ),
);
Slider.displayName = 'Slider';
