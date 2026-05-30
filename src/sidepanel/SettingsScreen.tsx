import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

export function SettingsScreen() {
  const { t } = useTranslation('settings');
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
    </div>
  );
}
