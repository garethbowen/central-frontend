// // TODO before merging, find common fns and extract to common package
// import { createIntl, type IntlShape  } from '@formatjs/intl';
// import enRaw from '../../locales/strings_en.json';


// export const TRANSLATE = Symbol('translate');
// const FALLBACK_LOCALE = 'en';

// type TransifexTranslation = Record<string, string | { string: string }>;
// type ICUMessage = Record<string, string>;
// export type TranslateValues = NonNullable<Parameters<IntlShape['formatMessage']>[1]>;
// export type Translate = (id: string, values?: TranslateValues) => string;

// const availableTranslations = import.meta.glob<{ default: TransifexTranslation }>(
//   '../../locales/strings_*.json'
// );

// export const WEB_FORMS_STORAGE_KEY = 'odk-web-forms-locale';
// export const CENTRAL_STORAGE_KEY = 'locale';

// const baseLanguage = (code: string): string => code.split('-')[0] ?? code;
// const localeImportKey = (locale: string) => `../../locales/strings_${locale}.json`;

// const getMessages = async (locale: string) => {
//   const key = localeImportKey(locale);
//   try {
//     const raw = await availableTranslations[key]!();
//     return { ...enMessages, ...normalizeMessages(raw.default) };
//   } catch (error) {
//     console.warn(`Failed to load messages for locale "${locale}", falling back to English:`, error);
//     return enMessages;
//   };
// };

// const isSupportedLocale = (locale: string | null) => {
//   return locale && Object.hasOwn(availableTranslations, localeImportKey(locale));
// };

// const getUserSelectedLocaleWebForms = () => {
//   try {
//     const locale = localStorage.getItem(WEB_FORMS_STORAGE_KEY);
//     return isSupportedLocale(locale) ? locale : null;
//   } catch {
//     return null;
//   }
// };

// const getUserSelectedLocaleCentral = () => {
//   try {
//     const locale = localStorage.getItem(CENTRAL_STORAGE_KEY);
//     return isSupportedLocale(locale) ? locale : null;
//   } catch {
//     return null;
//   }
// };

// const getBrowserLanguage = () => {
//   const browserLanguages = navigator.languages ?? [navigator.language];
//   for (const lang of browserLanguages) {
//     if (isSupportedLocale(lang)) {
//       return lang;
//     }
//     const baseLang = baseLanguage(lang);
//     if (isSupportedLocale(baseLanguage(baseLang))) {
//       return baseLang;
//     }
//   }
//   return null;
// };

// /**
//  * Transifex exports messages wrapped in an object (e.g., `{ string: "..." }`).
//  * This flattens them into a consistent key-value pair.
//  */
// const normalizeMessages = (raw: TransifexTranslation): ICUMessage => {
//   const result: ICUMessage = {};

//   for (const key in raw) {
//     const message = raw[key];
//     const value = typeof message === 'string' ? message : message?.string;
//     if (value) {
//       result[key] = value;
//     }
//   }

//   return result;
// };

// const getLocale = () => {
//   return getUserSelectedLocaleWebForms()
//     || getUserSelectedLocaleCentral()
//     || getBrowserLanguage()
//     || FALLBACK_LOCALE;
// };
// const locale = getLocale();

// const enMessages = normalizeMessages(enRaw);
// const messages = await getMessages(locale);
// const intl = createIntl({ locale, messages, defaultLocale: FALLBACK_LOCALE });

// export const translate = (id, values) => intl.formatMessage({ id }, values) as string;
