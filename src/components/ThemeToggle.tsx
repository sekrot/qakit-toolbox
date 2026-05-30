import { Moon, Sun, Monitor } from 'lucide-react';
import { useSettings, type Theme } from '@/storage/store';
import { Button } from './ui/Button';
import { cn } from '@/lib/cn';

const OPTIONS: { value: Theme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useSettings();
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border p-0.5">
      {OPTIONS.map(({ value, icon: Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="icon"
          aria-label={value}
          onClick={() => setTheme(value)}
          className={cn('h-7 w-7', theme === value && 'bg-accent')}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
