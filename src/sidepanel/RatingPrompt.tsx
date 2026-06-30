import { useTranslation } from 'react-i18next';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RatingPromptProps {
  onRate: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export function RatingPrompt({ onRate, onSnooze, onDismiss }: RatingPromptProps) {
  const { t } = useTranslation('common');
  return (
    <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-3 pr-8">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('ratingPrompt.dismissTitle')}
        title={t('ratingPrompt.dismissTitle')}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="flex items-start gap-2">
        <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-sm font-medium">{t('ratingPrompt.title')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t('ratingPrompt.body')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={onRate}>
              {t('ratingPrompt.rate')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onSnooze}>
              {t('ratingPrompt.later')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
