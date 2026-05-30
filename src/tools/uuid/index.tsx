import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { generateMany, type UuidVersion } from './logic';

const VERSIONS: { value: UuidVersion; label: string; hint: string }[] = [
  { value: 'v4', label: 'v4', hint: 'Random' },
  { value: 'v7', label: 'v7', hint: 'Time-ordered' },
  { value: 'nil', label: 'NIL', hint: 'All zeros' },
];

export default function UuidTool() {
  const { t } = useTranslation('common');
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>(() => generateMany('v4', 5));
  const [copied, setCopied] = useState<string | null>(null);

  const regenerate = (v: UuidVersion = version, c: number = count) => {
    setVersion(v);
    setIds(generateMany(v, c));
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {VERSIONS.map((v) => (
          <Button
            key={v.value}
            variant={version === v.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => regenerate(v.value)}
            title={v.hint}
          >
            {v.label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Count</span>
          <Input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) {
                setCount(next);
                regenerate(version, next);
              }
            }}
            className="w-20 text-center"
          />
          <Button variant="secondary" size="sm" onClick={() => regenerate()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {VERSIONS.find((v) => v.value === version)?.hint} · {ids.length} generated
        </span>
        <Button variant="ghost" size="sm" onClick={() => copy(ids.join('\n'), 'all')}>
          <Copy className="h-3 w-3" />
          {copied === 'all' ? t('copied') : 'Copy all'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-md border border-border bg-muted">
        <ul className="divide-y divide-border">
          {ids.map((id, i) => (
            <li key={i} className="flex items-center justify-between gap-2 px-2 py-1.5">
              <span className="select-all font-mono text-xs">{id}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copy(id, `${i}`)}
                className="h-6 w-6 p-0"
              >
                {copied === String(i) ? (
                  <span className="text-[10px]">{t('copied')}</span>
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
