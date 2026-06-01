/**
 * Lock-mode tests — ~30 tests covering:
 *   1. normalizeLocked (via listCharacters / getCharacter)
 *   2. DB migration v9→v10 (cursor-based, adds locked field)
 *   3. useCharacterLocked hook
 *   4. Lock button in DesktopShell (label, toggle)
 *   5. Locked mode — permanent fields become read-only
 *   6. Locked mode — transient fields remain editable
 *   7. Cards can expand in locked mode; remove buttons hidden
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Character, Attack, InventoryItem, Feature, Spell } from '@/domain/character'
import { I18nProvider } from '@/i18n'
import { renderWithI18n } from './helpers/render'
import { useCharactersStore } from '@/store/characters'

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuthStatus', () => ({
  useAuthStatus: vi.fn().mockReturnValue('unauthenticated'),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('@/services/sync', () => ({
  scheduleEditSync:      vi.fn(),
  startPeriodicSync:     vi.fn(),
  stopPeriodicSync:      vi.fn(),
  getSyncStatus:         () => 'idle' as const,
  onSyncStatusChange:    () => () => undefined,
}))

// ── IndexedDB mock ─────────────────────────────────────────────────────────────

const dbStore = new Map<string, unknown>()

function makeTransactionMock() {
  const mockObjectStore = { openCursor: vi.fn().mockResolvedValue(null) }
  return { objectStore: vi.fn().mockReturnValue(mockObjectStore) }
}

vi.mock('idb', () => ({
  openDB: vi.fn().mockImplementation((_name: string, _version: number, opts?: {
    upgrade?: (db: unknown, oldVersion: number, newVersion: number, tx: unknown, event: unknown) => void
  }) => {
    if (opts?.upgrade) {
      const fakeDb = {
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        deleteObjectStore: vi.fn(),
      }
      const txMock = makeTransactionMock()
      opts.upgrade(fakeDb as never, 10, 10, txMock as never, {} as never)
    }
    return Promise.resolve({
      getAll: vi.fn().mockImplementation(() => Promise.resolve([...dbStore.values()])),
      get: vi.fn().mockImplementation((_s: string, id: string) => Promise.resolve(dbStore.get(id))),
      put: vi.fn().mockImplementation((_s: string, value: unknown) => {
        const r = value as { id: string }
        dbStore.set(r.id, r)
        return Promise.resolve()
      }),
      delete: vi.fn().mockImplementation((_s: string, id: string) => {
        dbStore.delete(id)
        return Promise.resolve()
      }),
      close: vi.fn(),
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      createObjectStore: vi.fn(),
      deleteObjectStore: vi.fn(),
      transaction: makeTransactionMock,
    })
  }),
}))

import { listCharacters, getCharacter } from '@/data/db'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char_001',
    name: 'Eira Thornwood',
    race: 'Wood Elf',
    background: 'Outlander',
    alignment: 'Neutral Good',
    classes: [{ name: 'Ranger', level: 5, hitDie: 10 }],
    experience: 6500,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 14, dex: 18, con: 14, int: 12, wis: 16, cha: 10 },
    proficiencyBonus: 3,
    hp: { current: 42, max: 42, temp: 0 },
    hitDice: [{ className: 'Ranger', current: 5, max: 5, dieSize: 10 }],
    deathSaves: { successes: 0, failures: 0 },
    ac: 16, initiative: 4, speed: 35,
    passivePerception: 16, spellSaveDC: 0, inspiration: false,
    savingThrows: [], skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
    attacks: [], inventory: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [],
    backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '', notes2: '',
    mountPet: '', mountPet2: '', alliesOrganizations: '',
    spells: [],
    spellSlots: {},
    spellcastingAbility: '',
    spellcastingClass: '',
    images: {},
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  }
}

function setStoreChar(char: Character) {
  useCharactersStore.setState({ characters: [char], loading: false, error: null })
}

// ── 1. normalizeLocked — via read functions ───────────────────────────────────

describe('normalizeLocked — listCharacters', () => {
  beforeEach(() => { dbStore.clear(); vi.clearAllMocks() })

  it('backfills locked=false when field is absent', async () => {
    const raw = makeChar({ id: 'no_locked' }) as Record<string, unknown>
    delete raw['locked']
    dbStore.set('no_locked', raw)
    const result = await listCharacters()
    expect(result[0]!.locked).toBe(false)
  })

  it('backfills locked=false when field is undefined', async () => {
    const raw: Record<string, unknown> = { ...makeChar({ id: 'undef_locked' }), locked: undefined }
    dbStore.set('undef_locked', raw)
    const result = await listCharacters()
    expect(result[0]!.locked).toBe(false)
  })

  it('preserves locked=true when already set', async () => {
    dbStore.set('locked_true', makeChar({ id: 'locked_true', locked: true }))
    const result = await listCharacters()
    expect(result[0]!.locked).toBe(true)
  })

  it('preserves locked=false when already set', async () => {
    dbStore.set('locked_false', makeChar({ id: 'locked_false', locked: false }))
    const result = await listCharacters()
    expect(result[0]!.locked).toBe(false)
  })
})

describe('normalizeLocked — getCharacter', () => {
  beforeEach(() => { dbStore.clear(); vi.clearAllMocks() })

  it('backfills locked=false when field is absent on single fetch', async () => {
    const raw = makeChar({ id: 'get_no_locked' }) as Record<string, unknown>
    delete raw['locked']
    dbStore.set('get_no_locked', raw)
    const result = await getCharacter('get_no_locked')
    expect(result!.locked).toBe(false)
  })

  it('preserves locked=true on single fetch', async () => {
    dbStore.set('get_locked', makeChar({ id: 'get_locked', locked: true }))
    const result = await getCharacter('get_locked')
    expect(result!.locked).toBe(true)
  })
})

// ── 2. DB migration v9→v10 ────────────────────────────────────────────────────

describe('Schema migration → v10 (locked field)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('v10 upgrade: openCursor called on characters store', async () => {
    const { openDB } = await import('idb')
    const mockObjectStore = { openCursor: vi.fn().mockResolvedValue(null) }
    const txMock = { objectStore: vi.fn().mockReturnValue(mockObjectStore) }

    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        deleteObjectStore: vi.fn(),
      }
      opts?.upgrade?.(fakeDb as never, 9, 10, txMock as never, {} as never)
      return Promise.resolve({
        getAll: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
      } as never)
    })

    await listCharacters()
    expect(txMock.objectStore).toHaveBeenCalledWith('characters')
    expect(mockObjectStore.openCursor).toHaveBeenCalled()
  })

  it('v10 upgrade does not run when oldVersion=10 (already up-to-date)', async () => {
    const { openDB } = await import('idb')
    const mockObjectStore = { openCursor: vi.fn().mockResolvedValue(null) }
    const txMock = { objectStore: vi.fn().mockReturnValue(mockObjectStore) }

    vi.mocked(openDB).mockImplementationOnce((_name, _version, opts) => {
      const fakeDb = {
        objectStoreNames: { contains: () => true },
        createObjectStore: vi.fn(),
        deleteObjectStore: vi.fn(),
      }
      // oldVersion=10 means already up-to-date — block should not run
      opts?.upgrade?.(fakeDb as never, 10, 10, txMock as never, {} as never)
      return Promise.resolve({
        getAll: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
      } as never)
    })

    await listCharacters()
    expect(txMock.objectStore).not.toHaveBeenCalledWith('characters')
  })
})

// ── 3. useCharacterLocked hook ────────────────────────────────────────────────

import { useCharacterLocked } from '@/hooks/useCharacterLocked'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(I18nProvider, null, children)

describe('useCharacterLocked hook', () => {
  beforeEach(() => {
    useCharactersStore.setState({ characters: [], loading: false, error: null })
    localStorage.clear()
  })

  it('returns false when character is not in store', () => {
    const { result } = renderHook(() => useCharacterLocked('nonexistent'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns false when character.locked is undefined', () => {
    const char = makeChar({ id: 'hook_test' })
    delete (char as Record<string, unknown>)['locked']
    useCharactersStore.setState({ characters: [char], loading: false, error: null })
    const { result } = renderHook(() => useCharacterLocked('hook_test'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns false when character.locked is false', () => {
    useCharactersStore.setState({
      characters: [makeChar({ id: 'hook_unlocked', locked: false })],
      loading: false, error: null,
    })
    const { result } = renderHook(() => useCharacterLocked('hook_unlocked'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('returns true when character.locked is true', () => {
    useCharactersStore.setState({
      characters: [makeChar({ id: 'hook_locked', locked: true })],
      loading: false, error: null,
    })
    const { result } = renderHook(() => useCharacterLocked('hook_locked'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('returns false for a different id even if another character is locked', () => {
    useCharactersStore.setState({
      characters: [
        makeChar({ id: 'char_a', locked: true }),
        makeChar({ id: 'char_b', locked: false }),
      ],
      loading: false, error: null,
    })
    const { result } = renderHook(() => useCharacterLocked('char_b'), { wrapper })
    expect(result.current).toBe(false)
  })
})

// ── 4. Lock button in DesktopShell ────────────────────────────────────────────

import { DesktopShell } from '@/components/sheet/DesktopShell'

function renderDesktopShell(char: Character, lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>
        <DesktopShell character={char} activeTab="status" onTabChange={vi.fn()}>
          <div />
        </DesktopShell>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('DesktopShell lock button', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('shows lock label (PT) when unlocked', () => {
    const char = makeChar({ id: 'ds_pt_unlocked', locked: false })
    setStoreChar(char)
    renderDesktopShell(char, 'pt')
    expect(screen.getByTestId('lock-btn').textContent).toContain('Bloquear')
  })

  it('shows unlock label (PT) when locked', () => {
    const char = makeChar({ id: 'ds_pt_locked', locked: true })
    setStoreChar(char)
    renderDesktopShell(char, 'pt')
    expect(screen.getByTestId('lock-btn').textContent).toContain('Destravar')
  })

  it('shows lock label (EN) when unlocked', () => {
    const char = makeChar({ id: 'ds_en_unlocked', locked: false })
    setStoreChar(char)
    renderDesktopShell(char, 'en')
    expect(screen.getByTestId('lock-btn').textContent).toContain('Lock')
  })

  it('shows unlock label (EN) when locked', () => {
    const char = makeChar({ id: 'ds_en_locked', locked: true })
    setStoreChar(char)
    renderDesktopShell(char, 'en')
    expect(screen.getByTestId('lock-btn').textContent).toContain('Unlock')
  })
})

// ── 5. Locked mode — permanent fields are read-only ──────────────────────────

import { HeroCard } from '@/components/sheet/parts/HeroCard'
import { BackstoryBlock } from '@/components/sheet/parts/BackstoryBlock'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import { FeaturesList } from '@/components/sheet/parts/FeaturesList'
import { InventoryList } from '@/components/sheet/parts/InventoryList'

const LOCKED_CHAR   = makeChar({ id: 'locked_char',   locked: true })
const UNLOCKED_CHAR = makeChar({ id: 'unlocked_char', locked: false })

describe('Locked mode — permanent fields read-only', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('HeroCard: name input is readOnly when locked', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<HeroCard character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('hero-name-input') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('HeroCard: name input is NOT readOnly when unlocked', () => {
    setStoreChar(UNLOCKED_CHAR)
    renderWithI18n(<HeroCard character={UNLOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('hero-name-input') as HTMLInputElement
    expect(input.readOnly).toBe(false)
  })

  it('HeroCard: race input is readOnly when locked', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<HeroCard character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('hero-race-input') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('HeroCard: background input is readOnly when locked', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<HeroCard character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('hero-background-input') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('BackstoryBlock: textarea is readOnly when locked', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<BackstoryBlock character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.readOnly).toBe(true)
  })

  it('BackstoryBlock: textarea is NOT readOnly when unlocked', () => {
    setStoreChar(UNLOCKED_CHAR)
    renderWithI18n(<BackstoryBlock character={UNLOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('backstory-textarea') as HTMLTextAreaElement
    expect(ta.readOnly).toBe(false)
  })

  it('AttacksList: add-attack button is hidden when locked', () => {
    const attack: Attack = {
      id: 'atk_1', name: 'Shortsword', kind: 'melee', ability: 'str',
      attackBonus: 4, damage: '1d6+2', damageType: 'Slashing',
      range: '5 ft', properties: '', notes: '',
    }
    const char = { ...LOCKED_CHAR, attacks: [attack] }
    setStoreChar(char)
    renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('add-attack-btn')).toBeNull()
  })

  it('AttacksList: add-attack button is visible when unlocked', () => {
    setStoreChar(UNLOCKED_CHAR)
    renderWithI18n(<AttacksList character={UNLOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-attack-btn')).toBeDefined()
  })

  it('FeaturesList: add-feature button (features-add) is hidden when locked', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<FeaturesList character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('features-add')).toBeNull()
  })

  it('FeaturesList: add-feature button (features-add) is visible when unlocked', () => {
    setStoreChar(UNLOCKED_CHAR)
    renderWithI18n(<FeaturesList character={UNLOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('features-add')).toBeDefined()
  })

  it('InventoryList: per-category add buttons are hidden when locked', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<InventoryList character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('add-item-weapon')).toBeNull()
    expect(screen.queryByTestId('add-item-misc')).toBeNull()
  })

  it('InventoryList: per-category add buttons are visible when unlocked', () => {
    setStoreChar(UNLOCKED_CHAR)
    renderWithI18n(<InventoryList character={UNLOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('add-item-weapon')).toBeDefined()
    expect(screen.getByTestId('add-item-misc')).toBeDefined()
  })
})

// ── 6. Locked mode — transient fields remain editable ────────────────────────

describe('Locked mode — transient fields remain editable', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('inspiration checkbox is NOT disabled when locked (transient field)', () => {
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<HeroCard character={LOCKED_CHAR} onUpdate={vi.fn()} />, 'en')
    const cb = screen.getByTestId('hero-inspiration-checkbox') as HTMLInputElement
    expect(cb.disabled).toBe(false)
  })

  it('inspiration checkbox fires onUpdate when locked', () => {
    const onUpdate = vi.fn()
    setStoreChar(LOCKED_CHAR)
    renderWithI18n(<HeroCard character={LOCKED_CHAR} onUpdate={onUpdate} />, 'en')
    fireEvent.click(screen.getByTestId('hero-inspiration-checkbox'))
    expect(onUpdate).toHaveBeenCalledWith({ inspiration: true })
  })

  it('item equipped checkbox remains enabled when locked (transient)', () => {
    const item: InventoryItem = {
      id: 'itm_equip', name: 'Shortsword', quantity: 1, weight: 2,
      category: 'weapon', description: '', equipped: false,
    }
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    const cb = screen.getByTestId('item-equipped-itm_equip') as HTMLInputElement
    expect(cb.disabled).toBe(false)
  })
})

// ── 7. Cards in locked mode — expand allowed, remove button hidden ────────────

describe('Locked mode — inventory item cards and feature remove buttons', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('item card is rendered in locked mode', () => {
    const item: InventoryItem = {
      id: 'itm_card', name: 'Staff', quantity: 1, weight: 4,
      category: 'weapon', description: 'A magic staff', equipped: false,
    }
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('inventory-item-itm_card')).toBeDefined()
  })

  it('remove button hidden inside item card when locked', () => {
    const item: InventoryItem = {
      id: 'itm_noremove', name: 'Dagger', quantity: 1, weight: 1,
      category: 'weapon', description: '', equipped: false,
    }
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('remove-item-itm_noremove')).toBeNull()
  })

  it('remove button visible inside item card when unlocked', () => {
    const item: InventoryItem = {
      id: 'itm_remove', name: 'Dagger', quantity: 1, weight: 1,
      category: 'weapon', description: '', equipped: false,
    }
    const char = { ...UNLOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('remove-item-itm_remove')).toBeDefined()
  })

  it('remove button hidden for feature when locked (feature-remove-<id>)', () => {
    const feature: Feature = {
      id: 'feat_lock', name: 'Favored Enemy', source: 'Ranger',
      description: 'Advantage vs. a chosen enemy type', type: 'passive',
    }
    const char = { ...LOCKED_CHAR, features: [feature] }
    setStoreChar(char)
    renderWithI18n(<FeaturesList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.queryByTestId('feature-remove-feat_lock')).toBeNull()
  })

  it('remove button visible for feature when unlocked (feature-remove-<id>)', () => {
    const feature: Feature = {
      id: 'feat_unlock', name: 'Natural Explorer', source: 'Ranger',
      description: 'Expertise in chosen terrain', type: 'passive',
    }
    const char = { ...UNLOCKED_CHAR, features: [feature] }
    setStoreChar(char)
    renderWithI18n(<FeaturesList character={char} onUpdate={vi.fn()} />, 'en')
    expect(screen.getByTestId('feature-remove-feat_unlock')).toBeDefined()
  })
})

// ── 8. SpellCard — field-level lock regression ────────────────────────────────

import { SpellList } from '@/components/sheet/parts/SpellList'

function makeSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    id: 'sp_001',
    name: '',           // empty name → auto-expands SpellCard
    level: 1,
    school: 'abjuration',
    castingTime: '1 action',
    range: '30 ft',
    description: 'A test spell description',
    prepared: false,
    ...overrides,
  }
}

describe('Lock — SpellCard fields read-only when locked', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('spell name input is readOnly when locked', () => {
    const spell = makeSpell()
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('spell-name-sp_001') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('spell name input is NOT readOnly when unlocked', () => {
    const spell = makeSpell()
    const char = { ...UNLOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('spell-name-sp_001') as HTMLInputElement
    expect(input.readOnly).toBe(false)
  })

  it('spell level select is disabled when locked', () => {
    const spell = makeSpell()
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const select = screen.getByTestId('spell-level-sp_001') as HTMLSelectElement
    expect(select.disabled).toBe(true)
  })

  it('spell school select is disabled when locked', () => {
    const spell = makeSpell()
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const select = screen.getByTestId('spell-school-sp_001') as HTMLSelectElement
    expect(select.disabled).toBe(true)
  })

  it('spell casting time is readOnly when locked', () => {
    const spell = makeSpell()
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('spell-casting-time-sp_001') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('spell range is readOnly when locked', () => {
    const spell = makeSpell()
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const input = screen.getByTestId('spell-range-sp_001') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('spell description is readOnly when locked', () => {
    const spell = makeSpell()
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const ta = screen.getByTestId('spell-description-sp_001') as HTMLTextAreaElement
    expect(ta.readOnly).toBe(true)
  })

  it('spell prepared toggle is NOT disabled when locked (transient)', () => {
    const spell = makeSpell({ level: 1 })
    const char = { ...LOCKED_CHAR, spells: [spell] }
    setStoreChar(char)
    renderWithI18n(<SpellList character={char} onUpdate={vi.fn()} />, 'en')
    const cb = screen.getByTestId('spell-prepared-sp_001') as HTMLInputElement
    expect(cb.disabled).toBe(false)
  })
})

// ── 9. ItemCard — field-level lock regression ─────────────────────────────────

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'itm_001',
    name: 'Iron Shield',
    quantity: 2,
    weight: 6,
    category: 'armor',
    description: 'A sturdy iron shield',
    equipped: false,
    ...overrides,
  }
}

describe('Lock — ItemCard fields read-only when locked', () => {
  beforeEach(() => {
    localStorage.clear()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  it('item name is readOnly when locked', () => {
    const item = makeItem()
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm_001'))
    const input = screen.getByTestId('item-name-itm_001') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('item name is NOT readOnly when unlocked', () => {
    const item = makeItem()
    const char = { ...UNLOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm_001'))
    const input = screen.getByTestId('item-name-itm_001') as HTMLInputElement
    expect(input.readOnly).toBe(false)
  })

  it('item weight input is readOnly when locked', () => {
    const item = makeItem()
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm_001'))
    const input = screen.getByTestId('item-weight-input-itm_001') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('item category select is disabled when locked', () => {
    const item = makeItem()
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm_001'))
    const select = screen.getByTestId('item-category-itm_001') as HTMLSelectElement
    expect(select.disabled).toBe(true)
  })

  it('item description is readOnly when locked', () => {
    const item = makeItem()
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm_001'))
    const ta = screen.getByTestId('item-description-itm_001') as HTMLTextAreaElement
    expect(ta.readOnly).toBe(true)
  })

  it('item quantity is NOT readOnly when locked (transient — spending consumables)', () => {
    const item = makeItem()
    const char = { ...LOCKED_CHAR, inventory: [item] }
    setStoreChar(char)
    renderWithI18n(<InventoryList character={char} onUpdate={vi.fn()} />, 'en')
    fireEvent.click(screen.getByTestId('inventory-item-itm_001'))
    const input = screen.getByTestId('item-quantity-itm_001') as HTMLInputElement
    expect(input.readOnly).toBe(false)
  })
})
