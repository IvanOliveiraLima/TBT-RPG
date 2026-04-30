import { createContext } from 'react';
import type { Lang, TranslateFn } from './types';

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslateFn;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
