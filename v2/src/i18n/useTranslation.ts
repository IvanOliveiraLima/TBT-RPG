import { useContext } from 'react';
import { I18nContext } from './context';

/**
 * Hook to access the translation function and current language.
 *
 * @example
 *   const { t, lang, setLang } = useTranslation();
 *   return <h1>{t('nav.attributes')}</h1>;
 *   return <span aria-label={t('aria.portrait', { name: 'Eira' })} />;
 *
 * @throws if called outside `<I18nProvider>`
 */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used inside <I18nProvider>');
  }
  return ctx;
}
