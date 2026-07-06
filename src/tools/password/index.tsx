import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { getValue, setValue } from '@/storage/storage';
import {
  DEFAULT_OPTIONS,
  MAX_LENGTH,
  MIN_LENGTH,
  SET_KEYS,
  charsetFor,
  enabledSets,
  entropyBits,
  generatePassword,
  strengthOf,
  type PasswordOptions,
  type SetKey,
} from './logic';

const OPTIONS_KEY = 'password.options';

const SET_SAMPLES: Record<SetKey, string> = {
  uppercase: 'A–Z',
  lowercase: 'a–z',
  digits: '0–9',
  symbols: '!@#$%',
};

const STRENGTH_COLOR: Record<ReturnType<typeof strengthOf>, string> = {
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
};

const STRENGTH_STEPS = ['weak', 'fair', 'good', 'strong'] as const;

export default function PasswordTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string, opts?: Record<string, unknown>) => t(`tools:password.ui.${k}`, opts);
  const [options, setOptions] = useState<PasswordOptions | null>(null);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void getValue<PasswordOptions>(OPTIONS_KEY, DEFAULT_OPTIONS)
      .then((saved) => setOptions({ ...DEFAULT_OPTIONS, ...saved }))
      .catch(() => setOptions(DEFAULT_OPTIONS));
  }, []);

  // Any option change regenerates instantly — the user always sees a
  // password that matches the current settings.
  useEffect(() => {
    if (!options) return;
    setPassword(generatePassword(options));
    void setValue(OPTIONS_KEY, options);
  }, [options]);

  if (!options) return null;

  const bits = entropyBits(options);
  const strength = strengthOf(bits);
  const strengthIndex = STRENGTH_STEPS.indexOf(strength);
  const activeSets = enabledSets(options);

  const patch = (p: Partial<PasswordOptions>) =>
    setOptions((prev) => (prev ? { ...prev, ...p } : prev));

  const regenerate = () => {
    setOptions((prev) => (prev ? { ...prev } : prev));
  };

  const copy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const setLength = (raw: number) => {
    if (Number.isNaN(raw)) return;
    patch({ length: Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(raw))) });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-md border border-border bg-muted p-3">
        <output
          aria-label={ui('result')}
          className="min-h-[3rem] select-all break-all font-mono text-base leading-snug"
        >
          {[...password].map((c, i) => (
            <span key={i} className={charColor(c)}>
              {c}
            </span>
          ))}
        </output>
        <div className="flex items-center gap-2">
          <Button onClick={copy} size="sm" className="flex-1">
            <Copy className="h-3 w-3" />
            {copied ? t('common:copied') : t('common:copy')}
          </Button>
          <Button
            onClick={regenerate}
            size="sm"
            variant="secondary"
            title={t('common:actions.regenerate')}
            aria-label={t('common:actions.regenerate')}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {STRENGTH_STEPS.map((step, i) => (
              <div
                key={step}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  i <= strengthIndex ? STRENGTH_COLOR[strength] : 'bg-border',
                )}
              />
            ))}
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {ui(`strength.${strength}`)} · {ui('bits', { bits })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="pw-length" className="text-xs font-medium">
            {ui('length')}
          </label>
          <input
            type="number"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={options.length}
            onChange={(e) => setLength(e.target.valueAsNumber)}
            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-center font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <input
          id="pw-length"
          type="range"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={options.length}
          onChange={(e) => setLength(e.target.valueAsNumber)}
          className="w-full accent-primary"
        />
      </div>

      <fieldset className="flex flex-col gap-1 rounded-md border border-border p-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {ui('characters')}
        </legend>
        {SET_KEYS.map((key) => {
          const lastEnabled = options[key] && activeSets.length === 1;
          return (
            <label
              key={key}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-1 text-xs hover:bg-accent',
                lastEnabled && 'cursor-not-allowed opacity-70',
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options[key]}
                  disabled={lastEnabled}
                  onChange={(e) => patch({ [key]: e.target.checked })}
                />
                {ui(key)}
              </span>
              <code className="font-mono text-muted-foreground">
                {previewChars(key, options.excludeAmbiguous)}
              </code>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-1 rounded-md border border-border p-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {ui('options')}
        </legend>
        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs hover:bg-accent">
          <input
            type="checkbox"
            checked={options.excludeAmbiguous}
            onChange={(e) => patch({ excludeAmbiguous: e.target.checked })}
          />
          <span>
            {ui('excludeAmbiguous')}
            <span className="block text-muted-foreground">{ui('excludeAmbiguousHint')}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs hover:bg-accent">
          <input
            type="checkbox"
            checked={options.requireEachSet}
            onChange={(e) => patch({ requireEachSet: e.target.checked })}
          />
          <span>{ui('requireEachSet')}</span>
        </label>
      </fieldset>
    </div>
  );
}

function charColor(c: string): string | undefined {
  if (/[0-9]/.test(c)) return 'text-sky-600 dark:text-sky-400';
  if (/[a-z]/i.test(c)) return undefined;
  return 'text-amber-600 dark:text-amber-400';
}

function previewChars(key: SetKey, excludeAmbiguous: boolean): string {
  if (key !== 'symbols') return SET_SAMPLES[key];
  return charsetFor('symbols', excludeAmbiguous).slice(0, 5);
}
