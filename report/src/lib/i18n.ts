
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend) // loads translations from /public/locales
  .use(LanguageDetector) // detect user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development', // Enable debug output in development
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // path to translation files
    },
    // Options for language detector
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'], // cache user language preference
    },
    react: {
      useSuspense: false, // Set to false to avoid issues if not using Suspense properly for translations
    }
  });

export default i18n;
