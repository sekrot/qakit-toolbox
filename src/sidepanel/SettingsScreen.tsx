import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink, Keyboard, Trash2, Upload } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/storage/store';
import { clearHistory, downloadExport, importPayload } from '@/storage/backup';

interface CommandBinding {
  name: string;
  description: string;
  shortcut: string;
}

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [commands, setCommands] = useState<CommandBinding[]>([]);

  useEffect(() => {
    chrome.commands?.getAll((all) => {
      setCommands(
        all
          .filter((c): c is { name: string; description: string; shortcut?: string } =>
            Boolean(c.name),
          )
          .map((c) => ({
            name: c.name,
            description: c.description ?? c.name,
            shortcut: c.shortcut ?? '',
          })),
      );
    });
  }, []);

  const openShortcutsPage = () => {
    void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  };

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
        <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          {t('shortcuts')}
        </h2>
        {commands.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-md border border-border bg-muted p-2 text-xs">
            {commands.map((cmd) => (
              <li key={cmd.name} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{cmd.description}</span>
                {cmd.shortcut ? (
                  <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                    {cmd.shortcut}
                  </kbd>
                ) : (
                  <span className="text-[10px] italic text-muted-foreground">
                    {t('shortcutsUnassigned')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-muted-foreground">{t('shortcutsHint')}</p>
        <Button variant="secondary" size="sm" onClick={openShortcutsPage} className="justify-start">
          <ExternalLink className="h-3 w-3" />
          {t('shortcutsCustomise')}
        </Button>
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
