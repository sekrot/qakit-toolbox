import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  parseTimestamp,
  parseDate,
  detectUnit,
  formatInTimezone,
  getRelative,
  type Unit,
} from './logic';

const COMMON_TZS = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
];

export default function TimestampTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string) => t(`tools:timestamp.ui.${k}`);
  const [tsInput, setTsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [unit, setUnit] = useState<Unit>('s');
  const [tz, setTz] = useState<string>(localTz());
  const [copied, setCopied] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const fromTs = useMemo(() => parseTimestamp(tsInput, unit), [tsInput, unit]);
  const fromDate = useMemo(() => parseDate(dateInput), [dateInput]);

  const setNow = () => {
    const now = new Date();
    setTsInput(String(unit === 's' ? Math.floor(now.getTime() / 1000) : now.getTime()));
    setDateInput(now.toISOString());
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <CurrentTimestamp
          now={nowTick}
          unit={unit}
          onCopy={copy}
          copied={copied === 'now'}
          nowLabel={ui('now')}
          clickToCopy={ui('clickToCopy')}
        />
        <Button variant="secondary" size="sm" onClick={setNow}>
          <Clock className="h-3 w-3" />
          {ui('useNow')}
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <Label>{ui('tsToDate')}</Label>
        <div className="flex items-center gap-2">
          <Input
            value={tsInput}
            onChange={(e) => {
              setTsInput(e.target.value);
              setUnit(detectUnit(e.target.value));
            }}
            placeholder="1700000000"
            className="font-mono"
          />
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            {(['s', 'ms'] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-sm px-2 py-1 ${unit === u ? 'bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        {fromTs.error && tsInput && <ErrorRow text={fromTs.error} />}
        {fromTs.ok && fromTs.date && (
          <DateOutput
            date={fromTs.date}
            tz={tz}
            onCopy={(text) => copy(text, 'ts-out')}
            copied={copied === 'ts-out'}
            now={nowTick}
            t={t}
          />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <Label>{ui('dateToTs')}</Label>
        <Input
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          placeholder="2023-11-14T22:13:20Z"
          className="font-mono"
        />
        {fromDate.error && dateInput && <ErrorRow text={fromDate.error} />}
        {fromDate.ok && fromDate.date && (
          <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-2 text-xs">
            <Row
              label={ui('seconds')}
              value={String(Math.floor(fromDate.date.getTime() / 1000))}
              onCopy={copy}
              copyKey="d-s"
              copied={copied === 'd-s'}
              t={t}
            />
            <Row
              label={ui('milliseconds')}
              value={String(fromDate.date.getTime())}
              onCopy={copy}
              copyKey="d-ms"
              copied={copied === 'd-ms'}
              t={t}
            />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <Label>{ui('timezone')}</Label>
        <select
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {[localTz(), ...COMMON_TZS.filter((z) => z !== localTz())].map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}

function CurrentTimestamp({
  now,
  unit,
  onCopy,
  copied,
  nowLabel,
  clickToCopy,
}: {
  now: number;
  unit: Unit;
  onCopy: (text: string, key: string) => void;
  copied: boolean;
  nowLabel: string;
  clickToCopy: string;
}) {
  const value = unit === 's' ? Math.floor(now / 1000) : now;
  return (
    <button
      onClick={() => onCopy(String(value), 'now')}
      className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs hover:bg-accent"
      title={clickToCopy}
    >
      <span className="text-muted-foreground">{nowLabel}</span>
      <span>{value}</span>
      {copied && <span className="text-primary">✓</span>}
    </button>
  );
}

function DateOutput({
  date,
  tz,
  onCopy,
  copied,
  now,
  t,
}: {
  date: Date;
  tz: string;
  onCopy: (text: string) => void;
  copied: boolean;
  now: number;
  t: (k: string) => string;
}) {
  const local = formatInTimezone(date, tz);
  const iso = date.toISOString();
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-2 text-xs">
      <Row
        label={t('tools:timestamp.ui.isoUtc')}
        value={iso}
        onCopy={(text) => onCopy(text)}
        copyKey="iso"
        copied={copied}
        t={t}
      />
      <Row
        label={tz}
        value={local}
        onCopy={(text) => onCopy(text)}
        copyKey="local"
        copied={false}
        t={t}
      />
      <div className="text-muted-foreground">{getRelative(date, now)}</div>
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  copyKey,
  copied,
  t,
}: {
  label: string;
  value: string;
  onCopy: (text: string, key: string) => void;
  copyKey: string;
  copied: boolean;
  t: (k: string) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono">{value}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(value, copyKey)}
          className="h-6 w-6 p-0"
        >
          {copied ? (
            <span className="text-[10px]">{t('common:copied')}</span>
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function ErrorRow({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
      {text}
    </div>
  );
}

function localTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}
