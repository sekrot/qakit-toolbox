import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Clock, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { decodeJwt, formatDuration } from './logic';

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export default function JwtTool() {
  const { t } = useTranslation('common');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setToken(SAMPLE)}>
          Load sample
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setToken('')} title={t('clear')}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        value={token}
        onChange={(e) => setToken(e.target.value.replace(/\s+/g, ''))}
        placeholder="Paste a JWT token here (eyJhbGc…)"
        className="min-h-[100px] break-all"
      />

      {result && !result.ok && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {result.error}
        </div>
      )}

      {result?.ok && result.parts && result.status && (
        <>
          <StatusBadge status={result.status} />
          <Section
            title="Header"
            value={pretty(result.parts.header)}
            onCopy={() => copy(pretty(result.parts!.header), 'header')}
            copied={copied === 'header'}
            t={t}
          />
          <Section
            title="Payload"
            value={pretty(result.parts.payload)}
            onCopy={() => copy(pretty(result.parts!.payload), 'payload')}
            copied={copied === 'payload'}
            t={t}
            extra={<ClaimTimestamps payload={result.parts.payload} />}
          />
          <Section
            title="Signature"
            value={result.parts.signature}
            onCopy={() => copy(result.parts!.signature, 'sig')}
            copied={copied === 'sig'}
            t={t}
          />
        </>
      )}
    </div>
  );
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

interface SectionProps {
  title: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  t: (key: string) => string;
  extra?: ReactNode;
}

function Section({ title, value, onCopy, copied, t, extra }: SectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="h-3 w-3" />
          {copied ? t('copied') : t('copy')}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-2 font-mono text-xs">
        {value}
      </pre>
      {extra}
    </div>
  );
}

function StatusBadge({ status }: { status: NonNullable<ReturnType<typeof decodeJwt>['status']> }) {
  if (status.expired) {
    return (
      <Badge tone="error" icon={AlertTriangle}>
        Expired
        {status.expiresIn != null && <span> · {formatDuration(status.expiresIn)} ago</span>}
      </Badge>
    );
  }
  if (status.notYetValid) {
    return (
      <Badge tone="warn" icon={Clock}>
        Not yet valid
      </Badge>
    );
  }
  if (status.expiresIn != null) {
    return (
      <Badge tone="ok" icon={CheckCircle2}>
        Valid · expires in {formatDuration(status.expiresIn)}
      </Badge>
    );
  }
  return (
    <Badge tone="ok" icon={CheckCircle2}>
      Decoded
    </Badge>
  );
}

interface BadgeProps {
  tone: 'ok' | 'warn' | 'error';
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}

function Badge({ tone, icon: Icon, children }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 self-start rounded-md border px-2 py-1 text-xs',
        tone === 'ok' && 'border-primary/30 bg-primary/10 text-primary',
        tone === 'warn' &&
          'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        tone === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </div>
  );
}

function ClaimTimestamps({ payload }: { payload: Record<string, unknown> }) {
  const items: { label: string; value: number }[] = [];
  for (const key of ['iat', 'nbf', 'exp']) {
    const v = payload[key];
    if (typeof v === 'number') items.push({ label: key, value: v });
  }
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label}>
          <span className="font-mono">{item.label}</span>:{' '}
          {new Date(item.value * 1000).toISOString()}
        </span>
      ))}
    </div>
  );
}
