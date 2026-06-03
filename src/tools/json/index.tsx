import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, FileJson, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { formatJson, minifyJson, validateJson, type JsonResult } from './logic';
import { runJsonPath, type JsonPathResult } from './jsonpath';
import { JsonPathInput } from './JsonPathInput';

const SAMPLE = `{
  "store": {
    "book": [
      { "title": "Sayings of the Century", "price": 8.95 },
      { "title": "Moby Dick", "price": 22.99 }
    ]
  }
}`;

type Mode = 'format' | 'minify' | 'jsonpath';

export default function JsonTool() {
  const { t } = useTranslation('common');
  const [input, setInput] = useState('');
  // Pre-seed the prefix so autocomplete fires the moment the user focuses
  // the field, but leave the actual key segment empty for them to type.
  const [path, setPath] = useState('$.');
  const [mode, setMode] = useState<Mode>('format');
  const [copied, setCopied] = useState(false);

  const formatResult: JsonResult = useMemo(() => {
    if (!input.trim()) return { ok: true, output: '' };
    if (mode === 'minify') return minifyJson(input);
    return formatJson(input);
  }, [input, mode]);

  const validation = useMemo(() => (input.trim() ? validateJson(input) : null), [input]);

  const pathResult: JsonPathResult | null = useMemo(() => {
    if (mode !== 'jsonpath' || !validation?.ok || validation.value === undefined) return null;
    return runJsonPath(validation.value, path);
  }, [mode, path, validation]);

  const displayOutput =
    mode === 'jsonpath' ? (pathResult?.output ?? '') : (formatResult.output ?? '');
  const displayError =
    mode === 'jsonpath'
      ? !validation?.ok
        ? validation?.error?.message
        : pathResult && !pathResult.ok
          ? pathResult.error
          : undefined
      : formatResult.error?.message;
  const errorLocation = mode !== 'jsonpath' ? formatResult.error : undefined;

  const onDrop = async (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setInput(await file.text());
  };

  const copy = async () => {
    if (!displayOutput) return;
    await navigator.clipboard.writeText(displayOutput);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ModeButton current={mode} value="format" onClick={setMode}>
          Format
        </ModeButton>
        <ModeButton current={mode} value="minify" onClick={setMode}>
          Minify
        </ModeButton>
        <ModeButton current={mode} value="jsonpath" onClick={setMode}>
          JSONPath
        </ModeButton>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)} title="Load sample">
            <FileJson className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput('')} title={t('clear')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        placeholder='{"hello": "world"} — or drag a .json file here'
        className="min-h-[140px]"
      />

      {mode === 'jsonpath' && (
        <JsonPathInput
          value={path}
          onChange={setPath}
          source={validation?.ok ? validation.value : undefined}
          placeholder="$.store.book[*].price"
        />
      )}

      {displayError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {displayError}
          {errorLocation?.line && (
            <span className="ml-1 opacity-70">
              (line {errorLocation.line}, col {errorLocation.column})
            </span>
          )}
        </div>
      )}

      <div className="relative flex-1">
        <Textarea
          value={displayOutput}
          readOnly
          placeholder="Output will appear here"
          className="h-full min-h-[160px]"
        />
        {displayOutput && (
          <Button variant="secondary" size="sm" onClick={copy} className="absolute right-2 top-2">
            <Copy className="h-3 w-3" />
            {copied ? t('copied') : t('copy')}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ModeButtonProps {
  current: Mode;
  value: Mode;
  onClick: (value: Mode) => void;
  children: ReactNode;
}

function ModeButton({ current, value, onClick, children }: ModeButtonProps) {
  return (
    <Button
      variant={current === value ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => onClick(value)}
    >
      {children}
    </Button>
  );
}
