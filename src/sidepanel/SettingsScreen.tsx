import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, Upload } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/storage/store';
import { clearHistory, downloadExport, importPayload } from '@/storage/backup';

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const flash = (next: { kind: 'ok' | 'error'; text: string }) => {
    setStatus(next);
    window.setTimeout(() => setStatus(null), 3000);
  };

  const onClearHistory = async () => {
    if (!window.confirm(t('clearHistoryConfirm'))) return;
    await clearHistory();
    flash({ kind: 'ok', text: t('clearHistory') });
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = await importPayload(text);
    if (result.ok) {
      flash({ kind: 'ok', text: t('imported', { count: result.imported ?? 0 }) });
    } else {
      flash({ kind: 'error', text: t('importFailed', { error: result.error ?? 'unknown' }) });
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-lg font-semibold">{t('title')}</h1>

      <section className="flex items-center justify-between">
        <span className="text-sm">{t('theme')}</span>
        <ThemeToggle />
      </section>
      <section className="flex items-center justify-between">
        <span className="text-sm">{t('language')}</span>
        <LanguageSelector />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('data')}
        </h2>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={downloadExport} className="justify-start">
            <Download className="h-3 w-3" />
            {t('exportSettings')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="justify-start"
          >
            <Upload className="h-3 w-3" />
            {t('importSettings')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImport}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearHistory}
            className="justify-start"
          >
            <Trash2 className="h-3 w-3" />
            {t('clearHistory')}
          </Button>
        </div>
        {status && (
          <p
            className={`text-xs ${status.kind === 'ok' ? 'text-primary' : 'text-destructive'}`}
            role="status"
          >
            {status.text}
          </p>
        )}
      </section>

      <section className="flex items-center justify-between">
        <span className="text-sm">Onboarding</span>
        <Button variant="secondary" size="sm" onClick={() => setOnboarded(false)}>
          Replay
        </Button>
      </section>
    </div>
  );
}
