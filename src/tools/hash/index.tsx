import { useEffect, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, FileUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { ALGORITHMS, ALGO_LABELS, hashFile, hashString, type Algorithm } from './logic';

type Mode = 'text' | 'file';

export default function HashTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:hash.ui.${k}`, opts);
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [enabled, setEnabled] = useState<Set<Algorithm>>(new Set(ALGORITHMS));
  const [results, setResults] = useState<Partial<Record<Algorithm, string>>>({});
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'text') return;
    let cancelled = false;
    setError(null);
    if (!text) {
      setResults({});
      return;
    }
    (async () => {
      const next: Partial<Record<Algorithm, string>> = {};
      for (const algo of ALGORITHMS) {
        if (!enabled.has(algo)) continue;
        next[algo] = await hashString(text, algo);
      }
      if (!cancelled) setResults(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [text, enabled, mode]);

  const computeFile = async (f: File) => {
    setBusy(true);
    setError(null);
    try {
      const next: Partial<Record<Algorithm, string>> = {};
      for (const algo of ALGORITHMS) {
        if (!enabled.has(algo)) continue;
        next[algo] = await hashFile(f, algo);
      }
      setResults(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setMode('file');
      setFile(f);
      void computeFile(f);
    }
  };

  const toggle = (algo: Algorithm) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(algo)) next.delete(algo);
      else next.add(algo);
      return next;
    });
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div
      className="flex h-full flex-col gap-3"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2">
        <Button
          variant={mode === 'text' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('text')}
        >
          {ui('modeText')}
        </Button>
        <Button
          variant={mode === 'file' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('file')}
        >
          {ui('modeFile')}
        </Button>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setText('');
              setFile(null);
              setResults({});
            }}
            title={t('common:clear')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {ALGORITHMS.map((algo) => (
          <button
            key={algo}
            onClick={() => toggle(algo)}
            className={cn(
              'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              enabled.has(algo)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {ALGO_LABELS[algo]}
          </button>
        ))}
      </div>

      {mode === 'text' ? (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ui('placeholderText')}
          className="min-h-[100px]"
        />
      ) : (
        <FileDrop
          file={file}
          busy={busy}
          onSelect={(f) => {
            setFile(f);
            void computeFile(f);
          }}
          dropLabel={ui('dropFile')}
          privacyLabel={ui('privacyNote')}
          kbLabel={(size) => ui('kb', { size })}
          computingLabel={ui('computing')}
        />
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {ALGORITHMS.filter((a) => enabled.has(a)).map((algo) => (
          <div key={algo} className="rounded-md border border-border bg-muted p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {ALGO_LABELS[algo]}
              </span>
              {results[algo] && (
                <Button variant="ghost" size="sm" onClick={() => copy(results[algo]!, algo)}>
                  <Copy className="h-3 w-3" />
                  {copied === algo ? t('common:copied') : t('common:copy')}
                </Button>
              )}
            </div>
            <code className="block break-all font-mono text-xs">
              {results[algo] ?? (busy ? ui('computing') : '—')}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileDrop({
  file,
  busy,
  onSelect,
  dropLabel,
  privacyLabel,
  kbLabel,
  computingLabel,
}: {
  file: File | null;
  busy: boolean;
  onSelect: (f: File) => void;
  dropLabel: string;
  privacyLabel: string;
  kbLabel: (size: string) => string;
  computingLabel: string;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted px-4 py-6 text-center text-sm hover:bg-accent">
      <FileUp className="h-6 w-6 text-muted-foreground" />
      {file ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {kbLabel((file.size / 1024).toFixed(1))} {busy && `· ${computingLabel}`}
          </span>
        </div>
      ) : (
        <>
          <span>{dropLabel}</span>
          <span className="text-xs text-muted-foreground">{privacyLabel}</span>
        </>
      )}
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
    </label>
  );
}
