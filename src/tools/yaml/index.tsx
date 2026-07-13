import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Download, FileCode2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { downloadYaml, jsonToYaml, type JsonToYamlResult } from './logic';

const SAMPLE = `{
  "name": "QAKit Toolbox",
  "version": "0.2.0",
  "offline": true,
  "categories": ["encoders", "generators", "testers"],
  "author": {
    "name": "QA Team",
    "contact": null
  }
}`;

const INPUT_MIN = 80;
const INPUT_MAX = 600;
const INPUT_DEFAULT = 140;

export default function YamlTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:yaml.ui.${k}`, opts);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_DEFAULT);
  const dragStartRef = useRef<{ y: number; h: number } | null>(null);

  const result: JsonToYamlResult = useMemo(
    () => (input.trim() ? jsonToYaml(input) : { ok: true, output: '' }),
    [input],
  );

  const onDrop = async (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setInput(await file.text());
  };

  const copy = async () => {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (result.output) downloadYaml(result.output, 'data.yaml');
  };

  const startResize = (e: ReactMouseEvent) => {
    e.preventDefault();
    dragStartRef.current = { y: e.clientY, h: inputHeight };
    const onMove = (ev: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const next = Math.max(INPUT_MIN, Math.min(INPUT_MAX, start.h + (ev.clientY - start.y)));
      setInputHeight(next);
    };
    const onUp = () => {
      dragStartRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{ui('inputLabel')}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput(SAMPLE)}
            title={ui('loadSampleTitle')}
          >
            <FileCode2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput('')} title={t('common:clear')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        placeholder={ui('placeholderInput')}
        style={{ height: inputHeight }}
        className="!resize-none"
      />

      {!result.ok && result.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {result.error}
        </div>
      )}

      <div className="relative flex items-center gap-2 pt-1.5">
        <button
          type="button"
          aria-label={String(ui('resizeTitle'))}
          title={String(ui('resizeTitle'))}
          onMouseDown={startResize}
          className="group absolute inset-x-0 top-0 flex h-2 cursor-row-resize items-center justify-center"
        >
          <span className="h-1 w-12 rounded-full bg-border transition-colors group-hover:bg-primary/60" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">
          {t('common:labels.output')}
        </span>
        {result.ok && result.output && (
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={copy}
              title={copied ? t('common:copied') : t('common:copy')}
              aria-label={copied ? t('common:copied') : t('common:copy')}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={download}
              title={t('common:actions.download')}
              aria-label={t('common:actions.download')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Textarea
          value={result.ok ? (result.output ?? '') : ''}
          readOnly
          placeholder={t('common:placeholders.outputArea')}
          className="h-full min-h-[160px]"
        />
      </div>
    </div>
  );
}
