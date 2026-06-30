import { describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { PasswordInput } from '@/components/primitives/PasswordInput'
import { renderWithI18n } from './helpers/render'

describe('PasswordInput', () => {
  beforeEach(() => { localStorage.clear() })

  it('renders as type="password" by default', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    expect((screen.getByTestId('pw') as HTMLInputElement).type).toBe('password')
  })

  it('toggles to type="text" when eye button is clicked', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    fireEvent.click(screen.getByTestId('password-visibility-toggle'))
    expect((screen.getByTestId('pw') as HTMLInputElement).type).toBe('text')
  })

  it('toggles back to type="password" on second click', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    fireEvent.click(screen.getByTestId('password-visibility-toggle'))
    fireEvent.click(screen.getByTestId('password-visibility-toggle'))
    expect((screen.getByTestId('pw') as HTMLInputElement).type).toBe('password')
  })

  it('aria-label reads "Mostrar senha" initially (PT)', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    expect(screen.getByTestId('password-visibility-toggle').getAttribute('aria-label')).toBe('Mostrar senha')
  })

  it('aria-label reads "Ocultar senha" after toggle (PT)', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    fireEvent.click(screen.getByTestId('password-visibility-toggle'))
    expect(screen.getByTestId('password-visibility-toggle').getAttribute('aria-label')).toBe('Ocultar senha')
  })

  it('aria-label reads "Show password" initially (EN)', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'en')
    expect(screen.getByTestId('password-visibility-toggle').getAttribute('aria-label')).toBe('Show password')
  })

  it('aria-label reads "Hide password" after toggle (EN)', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'en')
    fireEvent.click(screen.getByTestId('password-visibility-toggle'))
    expect(screen.getByTestId('password-visibility-toggle').getAttribute('aria-label')).toBe('Hide password')
  })

  it('aria-pressed is false initially', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    expect(screen.getByTestId('password-visibility-toggle').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed is true after toggle', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    fireEvent.click(screen.getByTestId('password-visibility-toggle'))
    expect(screen.getByTestId('password-visibility-toggle').getAttribute('aria-pressed')).toBe('true')
  })

  it('toggle button is type="button" (does not submit forms)', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} />, 'pt')
    expect((screen.getByTestId('password-visibility-toggle') as HTMLButtonElement).type).toBe('button')
  })

  it('toggle button is disabled when input is disabled', () => {
    renderWithI18n(<PasswordInput data-testid="pw" inputStyle={{}} disabled />, 'pt')
    expect((screen.getByTestId('password-visibility-toggle') as HTMLButtonElement).disabled).toBe(true)
  })

  it('data-testid prop is forwarded to the inner input', () => {
    renderWithI18n(<PasswordInput data-testid="login-password-input" inputStyle={{}} />, 'pt')
    expect(screen.getByTestId('login-password-input')).toBeDefined()
  })
})
