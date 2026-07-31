/**
 * Combat.4 — Cast button, slot consume/restore, and no-slots warning
 *
 * Covers:
 * - Spell attacks show "Cast" label (EN/PT); weapon attacks unchanged
 * - rollCheck called on every cast (regardless of slots)
 * - Leveled spell with current > 0: onConsumeSlot called via onUpdate(spellSlots)
 * - Leveled spell with current === 0: no consume, warning shown, warning auto-clears
 * - Cantrip (level 0): roll only, no slot chip, no consume, no warning
 * - Null level (indeterminate): roll only, no slot chip
 * - max === 0 (unset slots): roll only, no slot chip
 * - Slot readout chip visible when leveled spell with max > 0
 * - +1 restore button: calls onRestoreSlot, disabled at max
 * - locked: restore button hidden; consume still fires (transient)
 * - Weapon attack button label unchanged
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from './helpers/render'
import { AttacksList } from '@/components/sheet/parts/AttacksList'
import type { Character, Attack } from '@/domain/character'
import { useCharactersStore } from '@/store/characters'

vi.mock('@/services/sync', () => ({
  scheduleEditSync: vi.fn(),
  startPeriodicSync: vi.fn(),
  stopPeriodicSync: vi.fn(),
}))

/* ── Mock useSheetRoll ─────────────────────────────────────────────── */

const mockRollCheck = vi.fn()
const mockRollDamage = vi.fn()

vi.mock('@/hooks/useSheetRoll', () => ({
  useSheetRoll: () => ({ rollCheck: mockRollCheck, rollDamage: mockRollDamage }),
}))

/* ── Helpers ───────────────────────────────────────────────────────── */

function makeSpell(overrides?: Partial<Attack>): Attack {
  return {
    id: 'a1',
    name: 'Fireball',
    kind: 'spell',
    ability: 'int',
    attackBonus: 5,
    damage: '8d6',
    damageType: 'Fire',
    range: '150 ft',
    properties: '',
    notes: '',
    spellLevel: 3,
    ...overrides,
  }
}

function makeWeapon(overrides?: Partial<Attack>): Attack {
  return {
    id: 'w1',
    name: 'Longsword',
    kind: 'melee',
    ability: 'str',
    attackBonus: 4,
    damage: '1d8+3',
    damageType: 'Slashing',
    range: '5 ft',
    properties: '',
    notes: '',
    ...overrides,
  }
}

function makeChar(attacks: Attack[], slotOverrides?: Record<string, { current: number; max: number }>): Character {
  const defaultSlots: Record<string, { current: number; max: number }> = {
    '1': { current: 4, max: 4 },
    '2': { current: 3, max: 3 },
    '3': { current: 2, max: 3 },
    '4': { current: 0, max: 2 },
    '5': { current: 0, max: 0 },
    '6': { current: 0, max: 0 },
    '7': { current: 0, max: 0 },
    '8': { current: 0, max: 0 },
    '9': { current: 0, max: 0 },
  }
  return {
    id: 'c1',
    name: 'Test',
    race: '',
    background: '',
    alignment: '',
    classes: [{ name: 'Wizard', level: 5, hitDie: 6 }],
    experience: 0,
    age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
    abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 },
    proficiencyBonus: 3,
    hp: { current: 20, max: 20, temp: 0 },
    hitDice: [],
    deathSaves: { successes: 0, failures: 0 },
    ac: 12,
    initiative: 0,
    speed: 30,
    passivePerception: 10,
    spellSaveDC: 14,
    inspiration: false,
    savingThrows: [],
    skills: [],
    proficiencies: { weapons: [], armor: [], tools: [], other: [] },
    languages: [],
    attacks,
    spells: [],
    spellSlots: { ...defaultSlots, ...slotOverrides },
    spellcastingAbility: 'int',
    spellcastingClass: 'Wizard',
    inventory: [],
    currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
    features: [],
    backstory: '',
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    notes1: '',
    notes2: '',
    mountPet: '',
    mountPet2: '',
    alliesOrganizations: '',
    images: {},
    createdAt: 0,
    updatedAt: 0,
  }
}

/* ── Tests ─────────────────────────────────────────────────────────── */

describe('Combat.4 — Cast button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCharactersStore.setState({ characters: [], loading: false, error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /* ── Label / aria ── */

  describe('button label', () => {
    it('EN: spell attack shows "Cast" in the action button', () => {
      const char = makeChar([makeSpell()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      const btn = screen.getByTestId('attack-bonus-chip-a1')
      expect(btn.textContent).toMatch(/Cast/)
    })

    it('PT: spell attack shows "Conjurar" in the action button', () => {
      const char = makeChar([makeSpell()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      const btn = screen.getByTestId('attack-bonus-chip-a1')
      expect(btn.textContent).toMatch(/Conjurar/)
    })

    it('EN: weapon attack keeps "Attack" label unchanged', () => {
      const char = makeChar([makeWeapon()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      const btn = screen.getByTestId('attack-bonus-chip-w1')
      expect(btn.textContent).toMatch(/Attack/)
      expect(btn.textContent).not.toMatch(/Cast/)
    })

    it('PT: weapon attack keeps "Ataque" label unchanged (not "Conjurar")', () => {
      const char = makeChar([makeWeapon()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      const btn = screen.getByTestId('attack-bonus-chip-w1')
      expect(btn.textContent).not.toMatch(/Conjurar/)
    })

    it('aria-label for spell button is "Cast" / "Conjurar"', () => {
      const char = makeChar([makeSpell()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      const btn = screen.getByTestId('attack-bonus-chip-a1')
      expect(btn.getAttribute('aria-label')).toBe('Cast')
    })
  })

  /* ── Roll always fires ── */

  describe('rollCheck', () => {
    it('rollCheck is called when clicking cast with slots available', () => {
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 2, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })

    it('rollCheck is called even when slots are empty (cast anyway)', () => {
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 0, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })

    it('rollCheck is called for cantrip (level 0)', () => {
      const char = makeChar([makeSpell({ spellLevel: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })

    it('rollCheck label uses "Cast" for spell attacks', () => {
      const char = makeChar([makeSpell({ spellLevel: 2 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const [label] = mockRollCheck.mock.calls[0] as [string, ...unknown[]]
      expect(label).toMatch(/Cast/)
    })

    it('rollCheck is called for weapon attack (unchanged)', () => {
      const char = makeChar([makeWeapon()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-w1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })
  })

  /* ── Slot consume ── */

  describe('slot consume on cast', () => {
    it('leveled spell with current > 0: onUpdate reduces slot current by 1', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 2, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(onUpdate).toHaveBeenCalledTimes(1)
      const call = onUpdate.mock.calls[0][0] as Partial<Character>
      expect(call.spellSlots?.['3']).toEqual({ current: 1, max: 3 })
    })

    it('slot does not go below 0 (clamp)', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeSpell({ spellLevel: 2 })], { '2': { current: 0, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      // onUpdate not called for slots when current === 0
      const slotCalls = onUpdate.mock.calls.filter(c => 'spellSlots' in (c[0] as Partial<Character>))
      expect(slotCalls).toHaveLength(0)
    })

    it('cantrip (level 0): no onUpdate for slots', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeSpell({ spellLevel: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const slotCalls = onUpdate.mock.calls.filter(c => 'spellSlots' in (c[0] as Partial<Character>))
      expect(slotCalls).toHaveLength(0)
    })

    it('null level (indeterminate): no onUpdate for slots', () => {
      const onUpdate = vi.fn()
      // spell with no spellLevel set → resolveSpellLevel returns null (no match in character.spells)
      const attack: Attack = { ...makeSpell(), spellLevel: undefined }
      const char = makeChar([attack])
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const slotCalls = onUpdate.mock.calls.filter(c => 'spellSlots' in (c[0] as Partial<Character>))
      expect(slotCalls).toHaveLength(0)
    })

    it('max === 0 (slots not configured): no onUpdate for slots', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeSpell({ spellLevel: 5 })], { '5': { current: 0, max: 0 } })
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const slotCalls = onUpdate.mock.calls.filter(c => 'spellSlots' in (c[0] as Partial<Character>))
      expect(slotCalls).toHaveLength(0)
    })

    it('weapon attack: no onUpdate for slots', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeWeapon()])
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-w1'))
      const slotCalls = onUpdate.mock.calls.filter(c => 'spellSlots' in (c[0] as Partial<Character>))
      expect(slotCalls).toHaveLength(0)
    })
  })

  /* ── No-slots warning ── */

  describe('no-slots warning', () => {
    it('warning appears when casting with 0 slots', async () => {
      vi.useFakeTimers()
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 0, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(screen.getByTestId('attack-no-slots-a1')).toBeInTheDocument()
    })

    it('EN: warning text contains level number', async () => {
      vi.useFakeTimers()
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 0, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const warning = screen.getByTestId('attack-no-slots-a1')
      expect(warning.textContent).toMatch(/3/)
      expect(warning.textContent).toMatch(/cast anyway/i)
    })

    it('PT: warning text is in Portuguese', async () => {
      vi.useFakeTimers()
      const char = makeChar([makeSpell({ spellLevel: 2 })], { '2': { current: 0, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const warning = screen.getByTestId('attack-no-slots-a1')
      expect(warning.textContent).toMatch(/conjurada/i)
    })

    it('warning is absent when there are slots available', () => {
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 2, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(screen.queryByTestId('attack-no-slots-a1')).not.toBeInTheDocument()
    })

    it('warning auto-clears after ~4s', async () => {
      vi.useFakeTimers()
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 0, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(screen.getByTestId('attack-no-slots-a1')).toBeInTheDocument()
      await act(async () => { vi.advanceTimersByTime(4100) })
      expect(screen.queryByTestId('attack-no-slots-a1')).not.toBeInTheDocument()
    })

    it('warning absent for cantrip', () => {
      const char = makeChar([makeSpell({ spellLevel: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(screen.queryByTestId('attack-no-slots-a1')).not.toBeInTheDocument()
    })
  })

  /* ── Slot readout chip ── */

  describe('slot readout chip', () => {
    it('shows X/Y chip for leveled spell with max > 0', () => {
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 2, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      const chip = screen.getByTestId('attack-slot-readout-a1')
      expect(chip.textContent).toMatch(/2\/3/)
    })

    it('EN: chip shows "Slots" label', () => {
      const char = makeChar([makeSpell({ spellLevel: 1 })], { '1': { current: 3, max: 4 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      const chip = screen.getByTestId('attack-slot-readout-a1')
      expect(chip.textContent).toMatch(/Slots/)
    })

    it('PT: chip shows "Espaços" label', () => {
      const char = makeChar([makeSpell({ spellLevel: 1 })], { '1': { current: 3, max: 4 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      const chip = screen.getByTestId('attack-slot-readout-a1')
      expect(chip.textContent).toMatch(/Espa/)
    })

    it('chip absent for cantrip (level 0)', () => {
      const char = makeChar([makeSpell({ spellLevel: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-slot-readout-a1')).not.toBeInTheDocument()
    })

    it('chip absent when max === 0', () => {
      const char = makeChar([makeSpell({ spellLevel: 5 })], { '5': { current: 0, max: 0 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-slot-readout-a1')).not.toBeInTheDocument()
    })

    it('chip absent for indeterminate level', () => {
      const attack: Attack = { ...makeSpell(), spellLevel: undefined }
      const char = makeChar([attack])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-slot-readout-a1')).not.toBeInTheDocument()
    })

    it('chip absent for weapon attacks', () => {
      const char = makeChar([makeWeapon()])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-slot-readout-w1')).not.toBeInTheDocument()
    })
  })

  /* ── Restore (+1) button ── */

  describe('+1 restore button', () => {
    it('restore button calls onUpdate with current + 1', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 2, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-restore-slot-a1'))
      expect(onUpdate).toHaveBeenCalledTimes(1)
      const call = onUpdate.mock.calls[0][0] as Partial<Character>
      expect(call.spellSlots?.['3']).toEqual({ current: 3, max: 3 })
    })

    it('restore clamps at max (does not exceed)', () => {
      const onUpdate = vi.fn()
      const char = makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 3, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      const btn = screen.getByTestId('attack-restore-slot-a1')
      expect(btn).toBeDisabled()
    })

    it('restore button is disabled when current >= max', () => {
      const char = makeChar([makeSpell({ spellLevel: 1 })], { '1': { current: 4, max: 4 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-restore-slot-a1')).toBeDisabled()
    })

    it('restore button is enabled when current < max', () => {
      const char = makeChar([makeSpell({ spellLevel: 1 })], { '1': { current: 3, max: 4 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-restore-slot-a1')).not.toBeDisabled()
    })

    it('restore button is absent for cantrip', () => {
      const char = makeChar([makeSpell({ spellLevel: 0 })])
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-restore-slot-a1')).not.toBeInTheDocument()
    })

    it('restore button is absent when max === 0', () => {
      const char = makeChar([makeSpell({ spellLevel: 5 })], { '5': { current: 0, max: 0 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-restore-slot-a1')).not.toBeInTheDocument()
    })

    it('EN: restore button aria-label is "+1 slot"', () => {
      const char = makeChar([makeSpell({ spellLevel: 2 })], { '2': { current: 1, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-restore-slot-a1').getAttribute('aria-label')).toBe('+1 slot')
    })

    it('PT: restore button aria-label is "+1 espaço"', () => {
      const char = makeChar([makeSpell({ spellLevel: 2 })], { '2': { current: 1, max: 3 } })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'pt')
      expect(screen.getByTestId('attack-restore-slot-a1').getAttribute('aria-label')).toBe('+1 espaço')
    })
  })

  /* ── Locked mode ── */

  describe('locked mode', () => {
    function makeLocked() {
      const char: Character = {
        ...makeChar([makeSpell({ spellLevel: 3 })], { '3': { current: 2, max: 3 } }),
        locked: true,
      }
      // Seed the Zustand store so useCharacterLocked picks up locked: true
      useCharactersStore.setState({ characters: [char], loading: false, error: null })
      return char
    }

    it('restore button is absent when locked', () => {
      const char = makeLocked()
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.queryByTestId('attack-restore-slot-a1')).not.toBeInTheDocument()
    })

    it('slot readout chip is still visible when locked', () => {
      const char = makeLocked()
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-slot-readout-a1')).toBeInTheDocument()
    })

    it('clicking cast when locked still calls rollCheck', () => {
      const char = makeLocked()
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      expect(mockRollCheck).toHaveBeenCalledTimes(1)
    })
  })

  /* ── Multiple spells — independent slot tracking ── */

  describe('multiple spell levels', () => {
    it('each spell card shows the correct slot for its own level', () => {
      const spellA: Attack = { ...makeSpell(), id: 'a1', spellLevel: 1 }
      const spellB: Attack = { ...makeSpell(), id: 'a2', spellLevel: 3 }
      const char = makeChar([spellA, spellB], {
        '1': { current: 2, max: 4 },
        '3': { current: 1, max: 3 },
      })
      renderWithI18n(<AttacksList character={char} onUpdate={vi.fn()} />, 'en')
      expect(screen.getByTestId('attack-slot-readout-a1').textContent).toMatch(/2\/4/)
      expect(screen.getByTestId('attack-slot-readout-a2').textContent).toMatch(/1\/3/)
    })

    it('consuming a level-1 slot does not affect level-3 slots', () => {
      const onUpdate = vi.fn()
      const spellA: Attack = { ...makeSpell(), id: 'a1', spellLevel: 1 }
      const char = makeChar([spellA], {
        '1': { current: 3, max: 4 },
        '3': { current: 2, max: 3 },
      })
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const call = onUpdate.mock.calls[0][0] as Partial<Character>
      expect(call.spellSlots?.['1']).toEqual({ current: 2, max: 4 })
      expect(call.spellSlots?.['3']).toEqual({ current: 2, max: 3 }) // unchanged
    })
  })

  /* ── Retrofit inference: unnamed level uses character.spells match ── */

  describe('retrofit inference for slot consumption', () => {
    it('spell with no spellLevel but matched by name: slot consumed correctly', () => {
      const onUpdate = vi.fn()
      // Attack has no spellLevel; character.spells has "Fireball" at level 3
      const attack: Attack = { ...makeSpell(), spellLevel: undefined }
      const char: Character = {
        ...makeChar([attack], { '3': { current: 2, max: 3 } }),
        spells: [{ id: 's1', name: 'Fireball', level: 3, school: 'evocation', castingTime: '1 action', range: '150 ft', description: '', prepared: true }],
      }
      renderWithI18n(<AttacksList character={char} onUpdate={onUpdate} />, 'en')
      fireEvent.click(screen.getByTestId('attack-bonus-chip-a1'))
      const call = onUpdate.mock.calls[0][0] as Partial<Character>
      expect(call.spellSlots?.['3']).toEqual({ current: 1, max: 3 })
    })
  })
})
