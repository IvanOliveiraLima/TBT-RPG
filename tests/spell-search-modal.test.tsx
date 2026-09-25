import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import type { Character, Spell } from '@/domain/character'
import { SpellSearchModal } from '@/components/sheet/parts/SpellSearchModal'
import { SpellList } from '@/components/sheet/parts/SpellList'
import { renderWithI18n } from './helpers/render'
import type { SrdSpell } from '@/data/srd-spells'
import { useCharactersStore } from '@/store/characters'

vi.mock('@/services/sync', () => ({
  scheduleEditSync:   vi.fn(),
  startPeriodicSync:  vi.fn(),
  stopPeriodicSync:   vi.fn(),
  getSyncStatus:      () => 'idle' as const,
  onSyncStatusChange: () => () => undefined,
}))

// ─── SRD fixture spells (hoisted so the vi.mock factory can reference them) ──

const { FIXTURE_SRD, SRD_FIREBALL, SRD_BLESS, SRD_MAGE_ARMOR } = vi.hoisted(() => {
  const SRD_FIREBALL: SrdSpell = {
    slug:         'fireball',
    name:         'Fireball',
    level:        3,
    school:       'evocation',
    castingTime:  'action',
    range:        '150 feet',
    components:   'V, S, M',
    material:     'bat guano',
    duration:     'instantaneous',
    concentration: false,
    ritual:        false,
    description:  'A bright streak.',
    higherLevel:  'Damage increases.',
    classes:      ['Sorcerer', 'Wizard'],
    edition:      '2024',
  }
  const SRD_BLESS: SrdSpell = {
    slug:         'bless',
    name:         'Bless',
    level:        1,
    school:       'enchantment',
    castingTime:  'action',
    range:        '30 feet',
    components:   'V, S, M',
    material:     'sprinkling of holy water',
    duration:     '1 minute',
    concentration: true,
    ritual:        false,
    description:  'You bless up to three creatures.',
    higherLevel:  '',
    classes:      ['Cleric', 'Paladin'],
    edition:      '2024',
  }
  const SRD_MAGE_ARMOR: SrdSpell = {
    slug:         'mage-armor',
    name:         'Mage Armor',
    level:        1,
    school:       'abjuration',
    castingTime:  'action',
    range:        'Touch',
    components:   'V, S, M',
    material:     'leather',
    duration:     '8 hours',
    concentration: false,
    ritual:        false,
    description:  'You touch a willing creature.',
    higherLevel:  '',
    classes:      ['Wizard'],
    edition:      '2024',
  }
  return { SRD_FIREBALL, SRD_BLESS, SRD_MAGE_ARMOR, FIXTURE_SRD: [SRD_FIREBALL, SRD_BLESS, SRD_MAGE_ARMOR] }
})

// Mock the srd-spells module
vi.mock('@/data/srd-spells', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/srd-spells')>()
  return {
    ...actual,
    loadSrdSpells: vi.fn().mockResolvedValue(FIXTURE_SRD),
    SRD_ATTRIBUTION: 'Dados do SRD via Open5e (CC-BY-4.0 / OGL).',
  }
})

// ─── Character fixture ────────────────────────────────────────────────────────

function makeSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    id: crypto.randomUUID(),
    name: 'Prestidigitation',
    level: 0,
    school: 'transmutation',
    castingTime: '1 action',
    range: '10 feet',
    description: 'Minor magical tricks.',
    prepared: false,
    ...overrides,
  }
}

const BASE_CHAR: Character = {
  id: 'char-test',
  name: 'Test',
  race: '',
  classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
  hitDice: [{ className: 'Wizard', dieSize: 6, current: 5 }],
  background: '',
  alignment: '',
  xp: 0,
  inspiration: false,
  abilities: {
    str: { score: 10, savingThrow: { proficient: false } },
    dex: { score: 10, savingThrow: { proficient: false } },
    con: { score: 10, savingThrow: { proficient: false } },
    int: { score: 16, savingThrow: { proficient: true } },
    wis: { score: 10, savingThrow: { proficient: false } },
    cha: { score: 10, savingThrow: { proficient: false } },
  },
  skills: {} as Character['skills'],
  hp: { current: 30, max: 30, temp: 0 },
  deathSaves: { successes: 0, failures: 0 },
  ac: 12,
  speed: 30,
  initiative: 0,
  passivePerception: 10,
  languages: [],
  proficiencies: [],
  features: [],
  attacks: [],
  spells: [],
  spellSlots: { '1': { current: 3, max: 3 }, '2': { current: 2, max: 2 }, '3': { current: 1, max: 1 }, '4': { current: 0, max: 0 }, '5': { current: 0, max: 0 }, '6': { current: 0, max: 0 }, '7': { current: 0, max: 0 }, '8': { current: 0, max: 0 }, '9': { current: 0, max: 0 } },
  spellcastingAbility: 'int',
  spellcastingClass: 'Wizard',
  inventory: [],
  currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '',
  notes2: '',
  mountPet: '',
  mountPet2: '',
  age: '',
  height: '',
  weight: '',
  eyeColor: '',
  skinColor: '',
  hairColor: '',
  images: {},
  exhaustion: 0,
}

// ─── SpellSearchModal tests ───────────────────────────────────────────────────

describe('SpellSearchModal', () => {
  beforeEach(() => {
    localStorage.setItem('tbt-rpg-v2-lang', 'en')
  })

  function renderModal(props: Partial<React.ComponentProps<typeof SpellSearchModal>> = {}) {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(
      <I18nProvider>
        <SpellSearchModal
          existingNames={new Set()}
          onAdd={onAdd}
          onClose={onClose}
          {...props}
        />
      </I18nProvider>
    )
    return { onAdd, onClose }
  }

  it('shows spell results after loading', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByTestId('srd-spell-fireball')).toBeDefined()
      expect(screen.getByTestId('srd-spell-bless')).toBeDefined()
      expect(screen.getByTestId('srd-spell-mage-armor')).toBeDefined()
    })
  })

  it('shows spell name, level and school', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText('Fireball')).toBeDefined()
      // Level 3 evocation
      expect(screen.getByText(/Nv 3/)).toBeDefined()
    })
  })

  it('calls onAdd and marks the spell as added when "Add" is clicked', async () => {
    const { onAdd } = renderModal()
    await waitFor(() => screen.getByTestId('srd-spell-add-fireball'))

    fireEvent.click(screen.getByTestId('srd-spell-add-fireball'))

    expect(onAdd).toHaveBeenCalledWith(SRD_FIREBALL)
    // Button becomes "✓ Added" and is disabled
    const btn = screen.getByTestId('srd-spell-add-fireball') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    expect(btn.textContent).toContain('Added')
  })

  it('pre-marks spells whose names are in existingNames', async () => {
    renderModal({ existingNames: new Set(['Fireball']) })
    await waitFor(() => screen.getByTestId('srd-spell-add-fireball'))

    const btn = screen.getByTestId('srd-spell-add-fireball') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    expect(btn.textContent).toContain('Added')
    // Bless is NOT pre-added
    const blessBtn = screen.getByTestId('srd-spell-add-bless') as HTMLButtonElement
    expect(blessBtn.disabled).toBe(false)
  })

  it('filters results by search query', async () => {
    renderModal()
    await waitFor(() => screen.getByTestId('spell-search-input'))

    fireEvent.change(screen.getByTestId('spell-search-input'), { target: { value: 'fire' } })

    await waitFor(() => {
      expect(screen.getByTestId('srd-spell-fireball')).toBeDefined()
      expect(screen.queryByTestId('srd-spell-bless')).toBeNull()
    })
  })

  it('shows empty state when no spells match', async () => {
    renderModal()
    await waitFor(() => screen.getByTestId('spell-search-input'))

    fireEvent.change(screen.getByTestId('spell-search-input'), { target: { value: 'zzznomatch' } })

    await waitFor(() => {
      expect(screen.getByTestId('spell-search-empty')).toBeDefined()
    })
  })

  it('shows the attribution footer', async () => {
    renderModal()
    await waitFor(() => {
      expect(screen.getByText(/CC-BY-4\.0/)).toBeDefined()
    })
  })

  it('calls onClose on Escape key', async () => {
    const { onClose } = renderModal()
    await waitFor(() => screen.getByTestId('spell-search-modal'))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking the overlay', async () => {
    const { onClose } = renderModal()
    const modal = await waitFor(() => screen.getByTestId('spell-search-modal'))

    fireEvent.click(modal)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows PT labels in Portuguese', async () => {
    localStorage.setItem('tbt-rpg-v2-lang', 'pt')
    const onAdd = vi.fn()
    render(
      <I18nProvider>
        <SpellSearchModal existingNames={new Set()} onAdd={onAdd} onClose={vi.fn()} />
      </I18nProvider>
    )
    await waitFor(() => screen.getByTestId('srd-spell-add-fireball'))

    const btn = screen.getByTestId('srd-spell-add-fireball')
    expect(btn.textContent).toBe('Adicionar')
  })
})

// ─── SpellList integration tests ─────────────────────────────────────────────

describe('SpellList — SRD spell search button', () => {
  beforeEach(() => {
    localStorage.setItem('tbt-rpg-v2-lang', 'en')
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('shows open-spell-search button when editable', () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <SpellList character={BASE_CHAR} onUpdate={onUpdate} />,
      'en',
    )
    expect(screen.getByTestId('open-spell-search')).toBeDefined()
  })

  it('does NOT show open-spell-search button in readOnly mode', () => {
    renderWithI18n(
      <SpellList character={BASE_CHAR} />,
      'en',
    )
    expect(screen.queryByTestId('open-spell-search')).toBeNull()
  })

  it('does NOT show open-spell-search button when locked', () => {
    const lockedChar = { ...BASE_CHAR, locked: true }
    useCharactersStore.setState({ characters: [lockedChar], loading: false, error: null })
    renderWithI18n(
      <SpellList character={lockedChar} onUpdate={vi.fn()} />,
      'en',
    )
    expect(screen.queryByTestId('open-spell-search')).toBeNull()
  })

  it('opens the modal when open-spell-search is clicked', async () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <SpellList character={BASE_CHAR} onUpdate={onUpdate} />,
      'en',
    )

    fireEvent.click(screen.getByTestId('open-spell-search'))

    await waitFor(() => {
      expect(screen.getByTestId('spell-search-modal')).toBeDefined()
    })
  })

  it('calls onUpdate with composed spell fields when adding via modal', async () => {
    const onUpdate = vi.fn()
    renderWithI18n(
      <SpellList character={BASE_CHAR} onUpdate={onUpdate} />,
      'en',
    )

    fireEvent.click(screen.getByTestId('open-spell-search'))
    await waitFor(() => screen.getByTestId('srd-spell-add-fireball'))

    fireEvent.click(screen.getByTestId('srd-spell-add-fireball'))

    expect(onUpdate).toHaveBeenCalled()
    const call = onUpdate.mock.calls[0]?.[0] as { spells: Spell[] }
    const added = call.spells[call.spells.length - 1]!
    expect(added.name).toBe('Fireball')
    expect(added.level).toBe(3)
    expect(added.school).toBe('evocation')
    expect(added.castingTime).toBe('action')
    expect(added.range).toBe('150 feet')
    expect(added.description).toContain('A bright streak.')
    expect(added.prepared).toBe(false)
    expect(added.id).toBeTruthy()
  })

  it('pre-marks spells already on the sheet as added', async () => {
    const charWithFireball = {
      ...BASE_CHAR,
      spells: [makeSpell({ name: 'Fireball', level: 3, school: 'evocation' })],
    }
    const onUpdate = vi.fn()
    renderWithI18n(
      <SpellList character={charWithFireball} onUpdate={onUpdate} />,
      'en',
    )

    fireEvent.click(screen.getByTestId('open-spell-search'))
    await waitFor(() => screen.getByTestId('srd-spell-add-fireball'))

    const btn = screen.getByTestId('srd-spell-add-fireball') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})
