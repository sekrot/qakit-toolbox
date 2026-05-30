import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { transform, detectDirection, type EncoderKind, type Direction } from './logic';

const KINDS: { value: EncoderKind; label: string }[] = [
  { value: 'base64', label: 'Base64' },
  { value: 'base64url', label: 'Base64 URL' },
  { value: 'url', label: 'URL' },
];

export default function EncodersTool() {
  const { t } = useTranslation('common');
  const [input, setInput] = useState('');
  const [kind, setKind] = useState<EncoderKind>('base64');
  const [direction, setDirection] = useState<Direction | 'auto'>('auto');
  const [copied, setCopied] = useState(false);

  const effectiveDirection: Direction = useMemo(
    () => (direction === 'auto' ? detectDirection(input, kind) : direction),
    [direction, input, kind],
  );

  const result = useMemo(
    () => transform(input, kind, effectiveDirection),
    [input, kind, effectiveDirection],
  );

  const swap = () => {
    if (result.ok && result.output != null) {
      setInput(result.output);
      setDirection(effectiveDirection === 'encode' ? 'decode' : 'encode');
    }
  };

  const copy = async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <Pill key={k.value} active={kind === k.value} onClick={() => setKind(k.value)}>
            {k.label}
          </Pill>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setInput('')} title={t('clear')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 self-start rounded-md border border-border p-0.5 text-xs">
        {(['auto', 'encode', 'decode'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={cn(
              'rounded-sm px-2 py-1 capitalize transition-colors',
              direction === d
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {d}
            {d === 'auto' && direction === 'auto' && (
              <span className="ml-1 text-[10px] opacity-70">({effectiveDirection})</span>
            )}
          </button>
        ))}
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text…"
        className="min-h-[120px]"
      />

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={swap} disabled={!result.ok || !result.output}>
          <ArrowLeftRight className="h-3 w-3" />
          Swap
        </Button>
      </div>

      {result.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {result.error}
        </div>
      )}

      <div className="relative flex-1">
        <Textarea
          value={result.output ?? ''}
          readOnly
          placeholder="Output will appear here"
          className="h-full min-h-[120px]"
        />
        {result.output && (
          <Button variant="secondary" size="sm" onClick={copy} className="absolute right-2 top-2">
            <Copy className="h-3 w-3" />
            {copied ? t('copied') : t('copy')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button variant={active ? 'primary' : 'secondary'} size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
