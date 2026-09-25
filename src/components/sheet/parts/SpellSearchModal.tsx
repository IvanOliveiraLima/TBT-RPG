/**
 * SpellSearchModal — search SRD spells and add them to the character sheet.
 *
 * Lazy-loads srd-spells.json on mount. Filters by name query, level, school.
 * Tracks added spells by slug so the user sees feedback immediately.
 */

import { useState, useEffect, useMemo } from 'react'
import type { SrdSpell } from '@/data/srd-spells'
import { loadSrdSpells, searchSpells, SRD_ATTRIBUTION } from '@/data/srd-spells'
import { SPELL_SCHOOLS } from '@/data/canonical/spell-schools'
import { useTranslation } from '@/i18n'
import type { SpellSchool } from '@/domain/character'

const T = {
  textPrimary:   '#F4EFE0',
  textMuted:     '#7A7788',
  elevated:      '#1B1725',
  bgCard:        '#201C2C',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  gold:          '#D4A017',
  sans:          "'Inter', system-ui, sans-serif",
  serif:         "'Cinzel', Georgia, serif",
} as const

export interface SpellSearchModalProps {
  existingNames: Set<string>
  onAdd: (spell: SrdSpell) => void
  onClose: () => void
}

export function SpellSearchModal({ existingNames, onAdd, onClose }: SpellSearchModalProps) {
  const { t } = useTranslation()

  const [all, setAll] = useState<SrdSpell[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined)
  const [schoolFilter, setSchoolFilter] = useState<string>('')

  const [added, setAdded] = useState<Set<string>>(() => new Set())

  // Load spells on mount, then initialise added from existingNames
  useEffect(() => {
    let cancelled = false
    loadSrdSpells().then(spells => {
      if (cancelled) return
      setAll(spells)
      setAdded(new Set(spells.filter(s => existingNames.has(s.name)).map(s => s.slug)))
      setLoading(false)
    })
    return () => { cancelled = true }
  // existingNames reference doesn't change after mount — intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const results = useMemo(() => {
    const opts: { level?: number; school?: string } = {}
    if (levelFilter !== undefined) opts.level = levelFilter
    if (schoolFilter !== '') opts.school = schoolFilter
    return searchSpells(all, query, opts)
  }, [all, query, levelFilter, schoolFilter])

  function handleAdd(spell: SrdSpell) {
    onAdd(spell)
    setAdded(prev => new Set(prev).add(spell.slug))
  }

  const schoolKey = (school: SpellSchool) =>
    `spells.school_${school}` as Parameters<typeof t>[0]

  return (
    <div
      data-testid="spell-search-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'rgba(0,0,0,0.6)',
      }}
    >
      <div
        style={{
          background:     T.elevated,
          border:         `1px solid ${T.borderDefault}`,
          borderRadius:   12,
          width:          'min(480px, 94vw)',
          maxHeight:      '82vh',
          display:        'flex',
          flexDirection:  'column',
          overflow:       'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            padding:      '14px 16px 10px',
            borderBottom: `1px solid ${T.borderSubtle}`,
            gap:          10,
          }}
        >
          <span
            style={{
              flex:       1,
              fontSize:   13,
              fontWeight: 600,
              color:      T.textPrimary,
              fontFamily: T.sans,
            }}
          >
            {t('spells.search_srd')}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background:  'transparent',
              border:      `1px solid ${T.borderDefault}`,
              borderRadius: 6,
              color:        T.textPrimary,
              fontSize:     12,
              fontWeight:   600,
              padding:      '4px 12px',
              cursor:       'pointer',
              fontFamily:   T.sans,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Filters ── */}
        <div
          style={{
            display:       'flex',
            gap:           8,
            padding:       '10px 16px 8px',
            borderBottom:  `1px solid ${T.borderSubtle}`,
            flexWrap:      'wrap',
          }}
        >
          {/* Search input */}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('spells.search_placeholder')}
            data-testid="spell-search-input"
            style={{
              flex:         '1 1 180px',
              background:   T.bgCard,
              border:       `1px solid ${T.borderDefault}`,
              borderRadius:  6,
              color:         T.textPrimary,
              fontFamily:    T.sans,
              fontSize:      13,
              padding:       '6px 10px',
              outline:       'none',
            }}
          />

          {/* Level select */}
          <select
            value={levelFilter ?? ''}
            onChange={e => setLevelFilter(e.target.value === '' ? undefined : Number(e.target.value))}
            data-testid="spell-search-level"
            className="dark-select"
            style={{
              flex:         '0 0 auto',
              background:   T.bgCard,
              border:       `1px solid ${T.borderDefault}`,
              borderRadius:  6,
              color:         T.textPrimary,
              fontFamily:    T.sans,
              fontSize:      12,
              padding:       '6px 8px',
              cursor:        'pointer',
            }}
          >
            <option value="">{t('spells.search_level_all')}</option>
            {[0,1,2,3,4,5,6,7,8,9].map(n => (
              <option key={n} value={n}>{n === 0 ? 'Cantrip' : `Level ${n}`}</option>
            ))}
          </select>

          {/* School select */}
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            data-testid="spell-search-school"
            className="dark-select"
            style={{
              flex:         '0 0 auto',
              background:   T.bgCard,
              border:       `1px solid ${T.borderDefault}`,
              borderRadius:  6,
              color:         T.textPrimary,
              fontFamily:    T.sans,
              fontSize:      12,
              padding:       '6px 8px',
              cursor:        'pointer',
            }}
          >
            <option value="">{t('spells.search_school_all')}</option>
            {SPELL_SCHOOLS.map(s => (
              <option key={s} value={s}>{t(schoolKey(s))}</option>
            ))}
          </select>
        </div>

        {/* ── Results ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, fontFamily: T.sans, marginTop: 24 }}>
              …
            </p>
          ) : results.length === 0 ? (
            <p
              data-testid="spell-search-empty"
              style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, fontFamily: T.sans, marginTop: 24 }}
            >
              {t('spells.search_empty')}
            </p>
          ) : (
            results.map(spell => {
              const isAdded = added.has(spell.slug)
              return (
                <div
                  key={spell.slug}
                  data-testid={`srd-spell-${spell.slug}`}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         10,
                    padding:     '7px 16px',
                    borderBottom: `1px solid ${T.borderSubtle}`,
                  }}
                >
                  {/* Spell info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize:    13,
                        fontWeight:  500,
                        color:       T.textPrimary,
                        fontFamily:  T.sans,
                        whiteSpace:  'nowrap',
                        overflow:    'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {spell.name}
                    </div>
                    <div
                      style={{
                        fontSize:   10,
                        color:      T.textMuted,
                        fontFamily: T.sans,
                        marginTop:  1,
                      }}
                    >
                      {`Nv ${spell.level} · ${t(schoolKey(spell.school as SpellSchool))}`}
                    </div>
                  </div>

                  {/* Add / Added button */}
                  <button
                    type="button"
                    data-testid={`srd-spell-add-${spell.slug}`}
                    disabled={isAdded}
                    onClick={() => handleAdd(spell)}
                    style={{
                      flexShrink:   0,
                      background:   isAdded ? 'rgba(85,160,90,0.15)' : 'transparent',
                      border:       `1px solid ${isAdded ? '#55A05A' : T.borderDefault}`,
                      borderRadius:  6,
                      color:         isAdded ? '#55A05A' : T.textPrimary,
                      fontFamily:    T.sans,
                      fontSize:      11,
                      fontWeight:    600,
                      padding:       '4px 10px',
                      cursor:        isAdded ? 'default' : 'pointer',
                      whiteSpace:    'nowrap',
                    }}
                  >
                    {isAdded ? t('spells.search_added') : t('spells.search_add')}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer (attribution) ── */}
        <div
          style={{
            padding:     '8px 16px',
            borderTop:   `1px solid ${T.borderSubtle}`,
            fontSize:     10,
            color:        T.textMuted,
            fontFamily:   T.sans,
            textAlign:    'center',
          }}
        >
          {SRD_ATTRIBUTION}
        </div>
      </div>
    </div>
  )
}
