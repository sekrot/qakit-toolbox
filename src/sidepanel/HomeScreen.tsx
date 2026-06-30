import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Search } from 'lucide-react';
import { TOOLS, CATEGORY_ORDER, type ToolDefinition } from '@/tools/registry';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  ensureInstallMeta,
  getRatingPrompt,
  getUsage,
  recentTools,
  setRatingPrompt,
  shouldShowRatingPrompt,
  totalUsage,
  RATING_SNOOZE_DAYS,
  type UsageStats,
} from '@/storage/telemetry';
import { subscribe } from '@/storage/storage';
import { CWS_REVIEW_URL } from '@/lib/cws';
import { RatingPrompt } from './RatingPrompt';

export function HomeScreen() {
  const { t } = useTranslation(['common', 'tools']);
  const [query, setQuery] = useState('');
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    void getUsage().then(setUsage);
    const unsub = subscribe<UsageStats>('devkit-usage', (next) => {
      if (next) setUsage(next);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const manifestVersion = chrome.runtime?.getManifest?.().version ?? '0.0.0';
      const [meta, rating, stats] = await Promise.all([
        ensureInstallMeta(manifestVersion),
        getRatingPrompt(),
        getUsage(),
      ]);
      if (cancelled) return;
      setShowRating(
        shouldShowRatingPrompt({
          installedAt: meta.installedAt,
          usageTotal: totalUsage(stats),
          rating,
          now: Date.now(),
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRate = () => {
    void chrome.tabs.create({ url: CWS_REVIEW_URL });
    void setRatingPrompt({ status: 'rated' });
    setShowRating(false);
  };

  const handleSnooze = () => {
    const snoozedUntil = Date.now() + RATING_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    void setRatingPrompt({ status: 'pending', snoozedUntil });
    setShowRating(false);
  };

  const handleDismiss = () => {
    void setRatingPrompt({ status: 'dismissed' });
    setShowRating(false);
  };

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = TOOLS.filter((tool) => {
      if (!q) return true;
      const name = t(tool.nameKey).toLowerCase();
      const description = t(tool.descriptionKey).toLowerCase();
      return name.includes(q) || description.includes(q);
    });
    return CATEGORY_ORDER.map((category) => ({
      category,
      tools: filtered.filter((tool) => tool.category === category),
    })).filter((group) => group.tools.length > 0);
  }, [query, t]);

  const recent = useMemo(() => {
    if (!usage || query) return [];
    return recentTools(usage, 4)
      .map(({ id }) => TOOLS.find((tool) => tool.id === id))
      .filter((tool): tool is ToolDefinition => Boolean(tool));
  }, [usage, query]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common:search')}
          className="pl-8"
        />
      </div>

      {showRating && !query && (
        <RatingPrompt onRate={handleRate} onSnooze={handleSnooze} onDismiss={handleDismiss} />
      )}

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t('common:recent')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {recent.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {grouped.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">{t('common:noResults')}</p>
      )}
      {grouped.map(({ category, tools }) => (
        <section key={category} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t(`tools:categories.${category}`)}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const { t } = useTranslation('tools');
  const Icon = tool.icon;
  return (
    <Link to={tool.route} className="block">
      <Card className="flex h-full flex-col gap-1 p-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium leading-tight">{t(tool.nameKey)}</h3>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{t(tool.descriptionKey)}</p>
      </Card>
    </Link>
  );
}
