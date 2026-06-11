/**
 * Tests for import/export UI components:
 * - ChooseImportModeModal: mode selection, warning, confirm disabled until selection
 * - ImportSuccessModal: shows result counts
 * - ImportErrorModal: shows translated error
 * - CombatStrip: AC editable input vs display; lock/forceReadOnly behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '@/i18n'
import { MemoryRouter } from 'react-router-dom'
import { ChooseImportModeModal } from '@/components/import-export/ChooseImportModeModal'
import { ImportSuccessModal } from '@/components/import-export/ImportSuccessModal'
import { ImportErrorModal } from '@/components/import-export/ImportErrorModal'
import { CombatStrip } from '@/components/sheet/parts/CombatStrip'
import type { ExportPayload } from '@/services/import-export'
import type { Character } from '@/domain/character'

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockLocked = false
vi.mock('@/hooks/useCharacterLocked', () => ({
  useCharacterLocked: () => mockLocked,
}))

let mockForceReadOnly = false
vi.mock('@/contexts/CampaignViewContext', () => ({
  useIsForceReadOnly: () => mockForceReadOnly,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem('tbt-rpg-v2-lang', 'pt')
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  )
}

function makePayload(count = 3): ExportPayload {
  return {
    schema_version: 10,
    exported_at: new Date().toISOString(),
    count,
    characters: [],
  }
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char1',
    name: 'Test',
    race: '', background: '', alignment: '',
    classes: [{ name: 'Fighter', level: 1, hitDie: 10 }],
    hitDice: [{ className: 'Fighter', dieSize: 10, total: 1, current: 1 }],
    abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 12, cha: 10 },
    savingThrows: [],
    skills: [],
    hp: { current: 10, max: 10, temp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    ac: 15,
    speed: 30,
    initiative: 0,
    inspiration: false,
    xp: 0,
    spellcastingAbility: '',
    spellcastingClass: '',
    spellSaveDC: 0,
    spellAttackBonus: 0,
    spellSlots: [],
    attacks: [],
    spells: [],
    inventory: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [],
    languages: [],
    proficiencies: [],
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    backstory: '', notes: '', bonds: '', ideals: '', flaws: '', traits: '',
    portrait: '',
    locked: false,
    updatedAt: 1000,
    ...overrides,
  } as unknown as Character
}

// ── ChooseImportModeModal ─────────────────────────────────────────────────────

describe('ChooseImportModeModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders the modal with choose mode title in PT', () => {
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    expect(screen.getByText('Escolher modo de importação')).toBeDefined()
  })

  it('shows file payload count', () => {
    render(<ChooseImportModeModal payload={makePayload(5)} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    expect(screen.getByText(/5 personagens/)).toBeDefined()
  })

  it('confirm button is disabled until mode is selected', () => {
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    expect(screen.getByTestId('import-mode-confirm')).toHaveProperty('disabled', true)
  })

  it('confirm button is enabled after selecting merge', async () => {
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-mode-merge'))
    expect(screen.getByTestId('import-mode-confirm')).toHaveProperty('disabled', false)
  })

  it('confirm button is enabled after selecting replace', async () => {
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-mode-replace'))
    expect(screen.getByTestId('import-mode-confirm')).toHaveProperty('disabled', false)
  })

  it('shows replace warning only when replace is selected', async () => {
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    expect(screen.queryByTestId('import-replace-warning')).toBeNull()
    await userEvent.click(screen.getByTestId('import-mode-replace'))
    expect(screen.getByTestId('import-replace-warning')).toBeDefined()
  })

  it('does not show replace warning when merge is selected', async () => {
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-mode-merge'))
    expect(screen.queryByTestId('import-replace-warning')).toBeNull()
  })

  it('calls onConfirm with merge when merge selected and confirmed', async () => {
    const onConfirm = vi.fn()
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={onConfirm} onCancel={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-mode-merge'))
    await userEvent.click(screen.getByTestId('import-mode-confirm'))
    expect(onConfirm).toHaveBeenCalledWith('merge')
  })

  it('calls onConfirm with replace when replace selected and confirmed', async () => {
    const onConfirm = vi.fn()
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={onConfirm} onCancel={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-mode-replace'))
    await userEvent.click(screen.getByTestId('import-mode-confirm'))
    expect(onConfirm).toHaveBeenCalledWith('replace')
  })

  it('calls onCancel when X button is clicked', async () => {
    const onCancel = vi.fn()
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={vi.fn()} onCancel={onCancel} />, { wrapper })
    await userEvent.click(screen.getByLabelText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not call onConfirm when confirm clicked with no selection', async () => {
    const onConfirm = vi.fn()
    render(<ChooseImportModeModal payload={makePayload()} onConfirm={onConfirm} onCancel={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-mode-confirm'))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

// ── ImportSuccessModal ────────────────────────────────────────────────────────

describe('ImportSuccessModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders success title in PT', () => {
    render(<ImportSuccessModal result={{ imported: 2, replaced: 1 }} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('Importação concluída')).toBeDefined()
  })

  it('shows imported and replaced counts', () => {
    render(<ImportSuccessModal result={{ imported: 3, replaced: 2 }} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText(/3 novos.*2 existentes/i)).toBeDefined()
  })

  it('close button calls onClose', async () => {
    const onClose = vi.fn()
    render(<ImportSuccessModal result={{ imported: 1, replaced: 0 }} onClose={onClose} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-success-close'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── ImportErrorModal ──────────────────────────────────────────────────────────

describe('ImportErrorModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders error title in PT', () => {
    render(<ImportErrorModal errorCode="invalid_json" onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('Falha na importação')).toBeDefined()
  })

  it('shows invalid_json error message', () => {
    render(<ImportErrorModal errorCode="invalid_json" onClose={vi.fn()} />, { wrapper })
    expect(screen.getByTestId('import-error-message').textContent).toBe('O arquivo não é um JSON válido.')
  })

  it('shows incompatible_version error message', () => {
    render(<ImportErrorModal errorCode="incompatible_version" onClose={vi.fn()} />, { wrapper })
    expect(screen.getByTestId('import-error-message').textContent).toContain('incompatível')
  })

  it('shows invalid_schema error message', () => {
    render(<ImportErrorModal errorCode="invalid_schema" onClose={vi.fn()} />, { wrapper })
    expect(screen.getByTestId('import-error-message').textContent).toContain('reconhecido')
  })

  it('close button calls onClose', async () => {
    const onClose = vi.fn()
    render(<ImportErrorModal errorCode="unknown" onClose={onClose} />, { wrapper })
    await userEvent.click(screen.getByTestId('import-error-close'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── CombatStrip — AC editable ─────────────────────────────────────────────────

describe('CombatStrip — AC field', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLocked = false
    mockForceReadOnly = false
  })

  it('renders AC value in display mode when no onUpdate', () => {
    render(<CombatStrip character={makeCharacter({ ac: 15 })} />, { wrapper })
    const acStat = screen.getByTestId('combat-stat-ac')
    expect(acStat.textContent).toContain('15')
    expect(acStat.querySelector('input')).toBeNull()
  })

  it('renders AC as NumberField input when onUpdate is provided', () => {
    render(
      <CombatStrip character={makeCharacter({ ac: 15 })} onUpdate={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByTestId('ac-input')).toBeDefined()
    expect((screen.getByTestId('ac-input') as HTMLInputElement).value).toBe('15')
  })

  it('calls onUpdate with new AC value when changed', async () => {
    const onUpdate = vi.fn()
    render(
      <CombatStrip character={makeCharacter({ ac: 15 })} onUpdate={onUpdate} />,
      { wrapper }
    )
    const input = screen.getByTestId('ac-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '17' } })
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ ac: 17 }))
  })

  it('renders AC as display when locked (not as input)', () => {
    mockLocked = true
    render(
      <CombatStrip character={makeCharacter({ ac: 16 })} onUpdate={vi.fn()} />,
      { wrapper }
    )
    const acStat = screen.getByTestId('combat-stat-ac')
    expect(acStat.textContent).toContain('16')
    expect(acStat.querySelector('input')).toBeNull()
  })

  it('renders AC as display when no onUpdate (preview mode)', () => {
    render(<CombatStrip character={makeCharacter({ ac: 13 })} />, { wrapper })
    const acStat = screen.getByTestId('combat-stat-ac')
    expect(acStat.querySelector('input')).toBeNull()
  })

  it('other stats remain display-only even with onUpdate', () => {
    render(
      <CombatStrip character={makeCharacter()} onUpdate={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByTestId('combat-stat-init').querySelector('input')).toBeNull()
    expect(screen.getByTestId('combat-stat-spd').querySelector('input')).toBeNull()
    expect(screen.getByTestId('combat-stat-pp').querySelector('input')).toBeNull()
    expect(screen.getByTestId('combat-stat-prof').querySelector('input')).toBeNull()
  })

  it('AC input accepts value 0', async () => {
    const onUpdate = vi.fn()
    render(
      <CombatStrip character={makeCharacter({ ac: 15 })} onUpdate={onUpdate} />,
      { wrapper }
    )
    const input = screen.getByTestId('ac-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0' } })
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ ac: 0 }))
  })

  it('AC input accepts max value 50', async () => {
    const onUpdate = vi.fn()
    render(
      <CombatStrip character={makeCharacter({ ac: 15 })} onUpdate={onUpdate} />,
      { wrapper }
    )
    const input = screen.getByTestId('ac-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '50' } })
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ ac: 50 }))
  })

  it('renders all combat stat cards', () => {
    render(<CombatStrip character={makeCharacter()} />, { wrapper })
    expect(screen.getByTestId('combat-stat-ac')).toBeDefined()
    expect(screen.getByTestId('combat-stat-init')).toBeDefined()
    expect(screen.getByTestId('combat-stat-spd')).toBeDefined()
    expect(screen.getByTestId('combat-stat-pp')).toBeDefined()
    expect(screen.getByTestId('combat-stat-prof')).toBeDefined()
  })
})
