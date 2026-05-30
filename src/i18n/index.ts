import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enTools from './locales/en/tools.json';
import enSettings from './locales/en/settings.json';
import deCommon from './locales/de/common.json';
import deTools from './locales/de/tools.json';
import deSettings from './locales/de/settings.json';
import frCommon from './locales/fr/common.json';
import frTools from './locales/fr/tools.json';
import frSettings from './locales/fr/settings.json';
import esCommon from './locales/es/common.json';
import esTools from './locales/es/tools.json';
import esSettings from './locales/es/settings.json';
import ruCommon from './locales/ru/common.json';
import ruTools from './locales/ru/tools.json';
import ruSettings from './locales/ru/settings.json';
import itCommon from './locales/it/common.json';
import itTools from './locales/it/tools.json';
import itSettings from './locales/it/settings.json';

export const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'es', 'ru', 'it'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { common: enCommon, tools: enTools, settings: enSettings },
  de: { common: deCommon, tools: deTools, settings: deSettings },
  fr: { common: frCommon, tools: frTools, settings: frSettings },
  es: { common: esCommon, tools: esTools, settings: esSettings },
  ru: { common: ruCommon, tools: ruTools, settings: ruSettings },
  it: { common: itCommon, tools: itTools, settings: itSettings },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'common',
    ns: ['common', 'tools', 'settings'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
