import { render } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import type { Lang } from '@/i18n'
import type { ReactElement } from 'react'

/**
 * Renders a component wrapped in `<I18nProvider>` with a fixed language.
 *
 * Sets `localStorage['tbt-rpg-v2-lang']` before render so that
 * `detectInitialLang()` always picks the intended language, making test
 * assertions deterministic regardless of the test environment's
 * `navigator.language`.
 *
 * @param ui   - The React element to render
 * @param lang - Language to activate ('pt' | 'en'). Defaults to 'pt'.
 *
 * @example
 *   renderWithI18n(<Sidebar ... />, 'pt')
 *   expect(screen.getByText('Atributos')).toBeDefined()
 *
 *   renderWithI18n(<Sidebar ... />, 'en')
 *   expect(screen.getByText('Attributes')).toBeDefined()
 */
export function renderWithI18n(ui: ReactElement, lang: Lang = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(<I18nProvider>{ui}</I18nProvider>)
}
