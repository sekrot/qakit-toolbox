import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/storage/store';
import { cn } from '@/lib/cn';

interface Step {
  key: 'welcome' | 'tools' | 'privacy' | 'ready';
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { key: 'welcome', icon: Sparkles },
  { key: 'tools', icon: Wrench },
  { key: 'privacy', icon: Shield },
  { key: 'ready', icon: Check },
];

export function Onboarding() {
  const { t } = useTranslation('common');
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const [step, setStep] = useState(0);

  const finish = () => setOnboarded(true);
  const next = () => (step === STEPS.length - 1 ? finish() : setStep(step + 1));
  const prev = () => setStep(Math.max(0, step - 1));

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-end px-3 py-2">
        {!isLast && (
          <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground">
            {t('skip')}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-10 w-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold">{t(`onboarding.${current.key}.title`)}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`onboarding.${current.key}.body`)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted',
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0} className="flex-1">
            <ArrowLeft className="h-3 w-3" />
            {t('back')}
          </Button>
          <Button size="sm" onClick={next} className="flex-1">
            {isLast ? t('getStarted') : t('next')}
            {!isLast && <ArrowRight className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
