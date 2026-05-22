import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import type { Character, Feature } from '@/domain/character'
import { FeaturesList } from '@/components/sheet/parts/FeaturesList'
import { renderWithI18n } from './helpers/render'

function feature(
  id: string,
  name: string,
  source: string,
  type: Feature['type'] = 'passive',
  usesLeft?: number,
  usesMax?: number,
): Feature {
  return { id, name, source, description: '', type, usesLeft, usesMax }
}

const FEATURES: Feature[] = [
  feature('f1', 'Druidic', 'Classe', 'passive'),
  feature('f2', 'Wild Shape', 'Classe', 'active', 2, 2),
  feature('f3', 'Stonecunning', 'Raça', 'passive'),
  feature('f4', 'Channel Divinity', 'Classe', 'active', 0, 1),
]

const BASE: Character = {
  id: 'c1',
  name: 'Tester',
  race: 'Dwarf',
  background: 'Hermit',
  alignment: 'NG',
  classes: [{ name: 'Druid', level: 4, hitDie: 8 }],
  experience: 0,
  age: '', height: '', weight: '', eyeColor: '', skinColor: '', hairColor: '',
  abilities: { str: 10, dex: 12, con: 14, int: 12, wis: 16, cha: 10 },
  proficiencyBonus: 2,
  hp: { current: 28, max: 28, temp: 0 },
  hitDice: [{ className: 'Druid', current: 4, max: 4, dieSize: 8 }],
  deathSaves: { successes: 0, failures: 0 },
  ac: 14, initiative: 1, speed: 25,
  passivePerception: 13, spellSaveDC: 13, inspiration: false,
  savingThrows: [], skills: [],
  proficiencies: { weapons: [], armor: [], tools: [], other: [] }, languages: [],
  attacks: [],
  inventory: [],
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  features: FEATURES,
  backstory: '',
  personality: { traits: '', ideals: '', bonds: '', flaws: '' },
  notes1: '', notes2: '',
  mountPet: '', mountPet2: '', alliesOrganizations: '',
  images: {},
  createdAt: 0,
  updatedAt: 0,
}

describe('FeaturesList', () => {
  beforeEach(() => { localStorage.clear() })

  // ── Read-only mode (no onUpdate) ────────────────────────────────────────────

  it('read-only empty: shows features-empty with PT text', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} />, 'pt')
    expect(screen.getByTestId('features-empty')).toBeDefined()
    expect(screen.getByText('Nenhuma feature registrada.')).toBeDefined()
  })

  it('read-only empty: shows features-empty with EN text', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} />, 'en')
    expect(screen.getByTestId('features-empty')).toBeDefined()
    expect(screen.getByText('No features recorded.')).toBeDefined()
  })

  it('read-only empty: no features-list container rendered', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} />, 'pt')
    expect(screen.queryByTestId('features-list')).toBeNull()
  })

  // ── Editable mode ────────────────────────────────────────────────────────────

  it('editable: renders features-list container', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('features-list')).toBeDefined()
  })

  it('editable: renders all feature cards by testid', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('feature-card-f1')).toBeDefined()
    expect(screen.getByTestId('feature-card-f2')).toBeDefined()
    expect(screen.getByTestId('feature-card-f3')).toBeDefined()
    expect(screen.getByTestId('feature-card-f4')).toBeDefined()
  })

  it('editable: shows feature names as input values', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByDisplayValue('Druidic')).toBeDefined()
    expect(screen.getByDisplayValue('Wild Shape')).toBeDefined()
    expect(screen.getByDisplayValue('Stonecunning')).toBeDefined()
  })

  it('editable: shows feature sources as input values', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    const classeInputs = screen.getAllByDisplayValue('Classe')
    expect(classeInputs.length).toBeGreaterThanOrEqual(3) // f1, f2, f4
  })

  it('editable: shows uses-row only for active features', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('feature-uses-row-f2')).toBeDefined()
    expect(screen.getByTestId('feature-uses-row-f4')).toBeDefined()
    expect(screen.queryByTestId('feature-uses-row-f1')).toBeNull()
    expect(screen.queryByTestId('feature-uses-row-f3')).toBeNull()
  })

  it('editable: uses inputs show correct values for active feature', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    const leftInput = screen.getByTestId('feature-uses-left-f2') as HTMLInputElement
    const maxInput = screen.getByTestId('feature-uses-max-f2') as HTMLInputElement
    expect(leftInput.value).toBe('2')
    expect(maxInput.value).toBe('2')
  })

  it('editable empty: shows features-empty testid', () => {
    renderWithI18n(<FeaturesList character={{ ...BASE, features: [] }} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('features-empty')).toBeDefined()
  })

  it('editable: shows add button', () => {
    renderWithI18n(<FeaturesList character={BASE} onUpdate={() => {}} />, 'pt')
    expect(screen.getByTestId('features-add')).toBeDefined()
  })

  // ── Adding ───────────────────────────────────────────────────────────────────

  it('add: calls onUpdate with new feature appended', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('features-add'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    expect(call.features).toHaveLength(FEATURES.length + 1)
  })

  it('add: new feature defaults to passive type', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('features-add'))
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    const newFeature = call.features![call.features!.length - 1]!
    expect(newFeature.type).toBe('passive')
  })

  it('add: new feature gets a non-empty id', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('features-add'))
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    const newFeature = call.features![call.features!.length - 1]!
    expect(typeof newFeature.id).toBe('string')
    expect(newFeature.id.length).toBeGreaterThan(0)
  })

  // ── Removing ─────────────────────────────────────────────────────────────────

  it('remove: calls onUpdate without the removed feature', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('feature-remove-f1'))
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    expect(call.features!.find(f => f.id === 'f1')).toBeUndefined()
  })

  it('remove: other features are preserved', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    fireEvent.click(screen.getByTestId('feature-remove-f1'))
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    expect(call.features!.find(f => f.id === 'f2')).toBeDefined()
    expect(call.features!.find(f => f.id === 'f3')).toBeDefined()
  })

  // ── Type change ───────────────────────────────────────────────────────────────

  it('type change active→passive: clears usesLeft and usesMax', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    const typeSelect = screen.getByTestId('feature-type-f2') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'passive' } })
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    const updated = call.features!.find(f => f.id === 'f2')!
    expect(updated.type).toBe('passive')
    expect(updated.usesLeft).toBeUndefined()
    expect(updated.usesMax).toBeUndefined()
  })

  it('type change active→reaction: clears usesLeft and usesMax', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    const typeSelect = screen.getByTestId('feature-type-f2') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'reaction' } })
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    const updated = call.features!.find(f => f.id === 'f2')!
    expect(updated.type).toBe('reaction')
    expect(updated.usesLeft).toBeUndefined()
    expect(updated.usesMax).toBeUndefined()
  })

  // ── usesMax clamp ─────────────────────────────────────────────────────────────

  it('usesMax decrease: clamps usesLeft when usesLeft > new usesMax', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    const maxInput = screen.getByTestId('feature-uses-max-f2') as HTMLInputElement
    fireEvent.change(maxInput, { target: { value: '1' } }) // usesLeft was 2, clamps to 1
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    const updated = call.features!.find(f => f.id === 'f2')!
    expect(updated.usesMax).toBe(1)
    expect(updated.usesLeft).toBe(1)
  })

  it('usesMax increase: does not change usesLeft', () => {
    const onUpdate = vi.fn()
    renderWithI18n(<FeaturesList character={BASE} onUpdate={onUpdate} />, 'pt')
    const maxInput = screen.getByTestId('feature-uses-max-f2') as HTMLInputElement
    fireEvent.change(maxInput, { target: { value: '5' } }) // usesLeft stays 2
    const call = onUpdate.mock.calls[0]![0] as Partial<Character>
    const updated = call.features!.find(f => f.id === 'f2')!
    expect(updated.usesMax).toBe(5)
    expect(updated.usesLeft).toBe(2)
  })
})
