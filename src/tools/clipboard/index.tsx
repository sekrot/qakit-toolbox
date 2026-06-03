import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardPaste, Copy, Pin, PinOff, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getValue, setValue, subscribe } from '@/storage/storage';
import {
  CLIPBOARD_STORAGE_KEY,
  clearUnpinned,
  pushItem,
  removeItem,
  searchItems,
  togglePin,
  type ClipboardItem,
} from './logic';

export default function ClipboardTool() {
  const { t } = useTranslation(['common', 'tools']);
  const ui = (k: string) => t(`tools:clipboard.ui.${k}`);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getValue<ClipboardItem[]>(CLIPBOARD_STORAGE_KEY, [])
      .then(setItems)
      .catch(() => undefined);
    const unsub = subscribe<ClipboardItem[]>(CLIPBOARD_STORAGE_KEY, (next) => setItems(next ?? []));
    return unsub;
  }, []);

  const persist = (next: ClipboardItem[]) => {
    setItems(next);
    void setValue(CLIPBOARD_STORAGE_KEY, next);
  };

  // Auto-capture: any copy event inside the side panel saves the selection.
  useEffect(() => {
    const handler = () => {
      const selection = document.getSelection()?.toString() ?? '';
      if (selection.trim()) {
        // Read latest items via callback form to avoid stale closure.
        setItems((prev) => {
          const next = pushItem(prev, selection);
          void setValue(CLIPBOARD_STORAGE_KEY, next);
          return next;
        });
      }
    };
    document.addEventListener('copy', handler);
    return () => document.removeEventListener('copy', handler);
  }, []);

  const captureClipboard = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError(ui('clipboardEmpty'));
        return;
      }
      persist(pushItem(items, text));
    } catch (e) {
      setError(e instanceof Error ? `${e.message} ${ui('readFailureSuffix')}` : ui('readFailed'));
    }
  };

  const onCopy = async (item: ClipboardItem) => {
    await navigator.clipboard.writeText(item.text);
    setCopied(item.id);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const filtered = useMemo(() => searchItems(items, query), [items, query]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button onClick={captureClipboard} size="sm">
          <ClipboardPaste className="h-3 w-3" />
          {ui('save')}
        </Button>
        {items.some((i) => !i.pinned) && (
          <Button variant="ghost" size="sm" onClick={() => persist(clearUnpinned(items))}>
            {ui('clearUnpinned')}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ui('searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <p className="text-[10px] text-muted-foreground">{ui('autoCaptureTip')}</p>

      <div className="flex-1 overflow-y-auto rounded-md border border-border bg-muted">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            {items.length === 0 ? ui('empty') : ui('noMatches')}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((item) => (
              <li key={item.id} className="flex items-start gap-2 px-2 py-1.5 text-xs">
                <pre className="line-clamp-3 flex-1 whitespace-pre-wrap break-all font-mono">
                  {item.text}
                </pre>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.ts).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => persist(togglePin(items, item.id))}
                      className="h-6 w-6 p-0"
                      title={item.pinned ? t('common:actions.unpin') : t('common:actions.pin')}
                    >
                      {item.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(item)}
                      className="h-6 w-6 p-0"
                      title={t('common:copy')}
                    >
                      {copied === item.id ? (
                        <span className="text-[10px]">{t('common:copied')}</span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => persist(removeItem(items, item.id))}
                      className="h-6 w-6 p-0"
                      title={t('common:actions.remove')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
