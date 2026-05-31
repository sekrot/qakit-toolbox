import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { runRegex, highlight, FLAG_INFO, CHEATSHEET } from './logic';

const SAMPLE_INPUT =
  'Contact us at hello@example.com or support@devkit.io.\nPhone: +1-555-0100, fax 555-0200.';
const SAMPLE_PATTERN = '\\b[\\w.+-]+@[\\w-]+\\.[\\w.-]+\\b';

export default function RegexTool() {
  const { t } = useTranslation('common');
  const [pattern, setPattern] = useState(SAMPLE_PATTERN);
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState(SAMPLE_INPUT);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const result = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text]);
  const segments = useMemo(
    () => (result.ok ? highlight(text, result.matches) : [{ text }]),
    [result, text],
  );

  const toggleFlag = (flag: string) => {
    setFlags((prev) => (prev.includes(flag) ? prev.replace(flag, '') : prev + flag));
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <div className="flex flex-1 items-center rounded-md border border-border bg-background font-mono text-xs">
          <span className="px-2 text-muted-foreground">/</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            className="h-8 flex-1 border-0 px-0 focus-visible:ring-0"
          />
          <span className="px-2 text-muted-foreground">/{flags}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {FLAG_INFO.map((f) => (
          <button
            key={f.flag}
            onClick={() => toggleFlag(f.flag)}
            title={`${f.name}: ${f.description}`}
            className={cn(
              'rounded-md border px-2 py-1 font-mono text-xs transition-colors',
              flags.includes(f.flag)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {f.flag}
          </button>
        ))}
      </div>

      {result.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {result.error}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Test string
        </h3>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text to test against…"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>
            Matches{' '}
            {result.ok && (
              <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 font-mono normal-case text-foreground">
                {result.matches.length}
              </span>
            )}
          </span>
        </h3>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-2 font-mono text-xs">
          {segments.map((seg, i) =>
            seg.matchIndex !== undefined ? (
              <mark
                key={i}
                className="rounded-sm bg-primary/30 px-0.5 text-foreground"
                title={`Match ${seg.matchIndex + 1}`}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </pre>
      </div>

      {result.ok &&
        result.matches.some(
          (m) => m.groups.length > 0 || Object.keys(m.namedGroups).length > 0,
        ) && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Capture groups
            </h3>
            <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border border-border bg-muted p-2 text-xs">
              {result.matches.map((m, i) => (
                <div key={i} className="font-mono">
                  <span className="text-muted-foreground">#{i + 1}</span> <span>{m.match}</span>
                  {m.groups.map((g, gi) => (
                    <span key={gi} className="ml-2 text-primary">
                      ${gi + 1}={g || '∅'}
                    </span>
                  ))}
                  {Object.entries(m.namedGroups).map(([k, v]) => (
                    <span key={k} className="ml-2 text-primary">
                      {k}={v}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="flex flex-col gap-1">
        <button
          onClick={() => setCheatsheetOpen((o) => !o)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          {cheatsheetOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <BookOpen className="h-3 w-3" />
          Cheatsheet
        </button>
        {cheatsheetOpen && (
          <div className="grid grid-cols-1 gap-1 rounded-md border border-border bg-muted p-2 text-xs">
            {CHEATSHEET.map((row) => (
              <div key={row.syntax} className="flex items-center gap-3">
                <code className="min-w-[110px] font-mono text-primary">{row.syntax}</code>
                <span className="text-muted-foreground">{row.meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result.ok && result.matches.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigator.clipboard.writeText(result.matches.map((m) => m.match).join('\n'))
          }
          className="self-start"
        >
          {t('copy')} all matches
        </Button>
      )}
    </div>
  );
}
