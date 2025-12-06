import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import uk from './locales/uk.json';

const resources = {
  en: { translation: en },
  uk: { translation: uk }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'uk'],

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    react: {
      useSuspense: false // Disable suspense for SSR compatibility
    }
  });

export default i18n;
