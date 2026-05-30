import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useSettings, type Language } from '@/storage/store';
import { SUPPORTED_LANGUAGES } from '@/i18n';

export function LanguageSelector() {
  const { i18n, t } = useTranslation('settings');
  const { language, setLanguage } = useSettings();

  useEffect(() => {
    if (language !== 'system' && i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language | 'system')}
      className="h-9 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <option value="system">{t('languages.system')}</option>
      {SUPPORTED_LANGUAGES.map((lng) => (
        <option key={lng} value={lng}>
          {t(`languages.${lng}`)}
        </option>
      ))}
    </select>
  );
}
