import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { computeLineDiff, type DiffOptions } from './logic';

const LEFT_SAMPLE = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}`;
const RIGHT_SAMPLE = `function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return name.length > 0;
}`;

type ViewMode = 'split' | 'unified';

export default function DiffTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string) => t(`tools:diff.ui.${k}`);
  const [left, setLeft] = useState(LEFT_SAMPLE);
  const [right, setRight] = useState(RIGHT_SAMPLE);
  const [view, setView] = useState<ViewMode>('split');
  const [opts, setOpts] = useState<DiffOptions>({ ignoreWhitespace: false, ignoreCase: false });

  const diff = useMemo(() => computeLineDiff(left, right, opts), [left, right, opts]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          {(['split', 'unified'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-sm px-2 py-1',
                view === v
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {ui(v)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={!!opts.ignoreWhitespace}
            onChange={(e) => setOpts((p) => ({ ...p, ignoreWhitespace: e.target.checked }))}
          />
          {ui('ignoreWhitespace')}
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={!!opts.ignoreCase}
            onChange={(e) => setOpts((p) => ({ ...p, ignoreCase: e.target.checked }))}
          />
          {ui('ignoreCase')}
        </label>
        <Stats
          added={diff.stats.added}
          removed={diff.stats.removed}
          unchanged={diff.stats.unchanged}
        />
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLeft('');
              setRight('');
            }}
            title={t('common:clear')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Textarea
          value={left}
          onChange={(e) => setLeft(e.target.value)}
          placeholder={ui('placeholderOriginal')}
          className="min-h-[120px]"
        />
        <Textarea
          value={right}
          onChange={(e) => setRight(e.target.value)}
          placeholder={ui('placeholderModified')}
          className="min-h-[120px]"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-md border border-border bg-muted font-mono text-xs">
        {view === 'split' ? <SplitView lines={diff.lines} /> : <UnifiedView lines={diff.lines} />}
      </div>
    </div>
  );
}

function Stats({
  added,
  removed,
  unchanged,
}: {
  added: number;
  removed: number;
  unchanged: number;
}) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="text-green-600 dark:text-green-400">+{added}</span>
      <span className="text-destructive">−{removed}</span>
      <span className="text-muted-foreground">={unchanged}</span>
    </div>
  );
}

const KIND_BG: Record<string, string> = {
  add: 'bg-green-500/10',
  remove: 'bg-destructive/10',
  context: '',
};

const KIND_MARK: Record<string, string> = {
  add: 'text-green-600 dark:text-green-400',
  remove: 'text-destructive',
  context: 'text-muted-foreground',
};

function UnifiedView({ lines }: { lines: ReturnType<typeof computeLineDiff>['lines'] }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {lines.map((line, i) => (
          <tr key={i} className={KIND_BG[line.kind]}>
            <td className="select-none px-2 text-right align-top text-muted-foreground/60">
              {line.oldNum ?? ''}
            </td>
            <td className="select-none px-2 text-right align-top text-muted-foreground/60">
              {line.newNum ?? ''}
            </td>
            <td className={cn('select-none px-1 align-top', KIND_MARK[line.kind])}>
              {line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}
            </td>
            <td className="whitespace-pre-wrap break-all px-2 py-0.5 align-top">
              {line.text || ' '}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SplitView({ lines }: { lines: ReturnType<typeof computeLineDiff>['lines'] }) {
  type Pair = { left?: (typeof lines)[number]; right?: (typeof lines)[number] };
  const pairs: Pair[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.kind === 'context') {
      pairs.push({ left: l, right: l });
    } else if (l.kind === 'remove') {
      const next = lines[i + 1];
      if (next && next.kind === 'add') {
        pairs.push({ left: l, right: next });
        i++;
      } else {
        pairs.push({ left: l });
      }
    } else {
      pairs.push({ right: l });
    }
  }

  return (
    <table className="w-full border-collapse">
      <tbody>
        {pairs.map((p, i) => (
          <tr key={i} className="align-top">
            <td
              className="select-none px-2 text-right text-muted-foreground/60"
              style={{ width: '2.5rem' }}
            >
              {p.left?.oldNum ?? ''}
            </td>
            <td
              className={cn(
                'whitespace-pre-wrap break-all px-2 py-0.5',
                p.left?.kind === 'remove' && KIND_BG.remove,
              )}
              style={{ width: '50%' }}
            >
              {p.left?.text || ' '}
            </td>
            <td
              className="select-none px-2 text-right text-muted-foreground/60"
              style={{ width: '2.5rem' }}
            >
              {p.right?.newNum ?? ''}
            </td>
            <td
              className={cn(
                'whitespace-pre-wrap break-all px-2 py-0.5',
                p.right?.kind === 'add' && KIND_BG.add,
              )}
              style={{ width: '50%' }}
            >
              {p.right?.text || ' '}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
