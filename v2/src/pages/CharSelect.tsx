import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharactersStore } from '@/store/characters'
import { useAuthStore } from '@/store/auth'
import type { Character } from '@/domain/character'

/* ── V1 production URL ────────────────────────────────────────────────── */
const V1_URL = 'https://ivanoliveiralima.github.io/TBT-RPG/'

/* ── Token constants (avoid Tailwind for inline styles — matches prototype) */
const T = {
  bg:            '#0F0D14',
  surface:       '#15121C',
  elevated:      '#1B1725',
  borderSubtle:  '#2A2537',
  borderDefault: '#3A3450',
  textPrimary:   '#F4EFE0',
  textSecondary: '#C8C4D6',
  textTertiary:  '#A09DB0',
  textMuted:     '#7A7788',
  ruby:          '#8B1A2E',
  purple:        '#5B3FA8',
  gold:          '#D4A017',
  success:       '#5DCAA5',
  danger:        '#E24B4A',
  serif:         "'Cinzel', Georgia, serif",
  sans:          "'Inter', system-ui, sans-serif",
} as const

/* ── D20 logo SVG ─────────────────────────────────────────────────────── */
function D20Logo() {
  return (
    <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
      <svg viewBox="0 0 48 48" width="46" height="46" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="d20g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#8B6FC5" />
            <stop offset="55%"  stopColor={T.purple} />
            <stop offset="100%" stopColor={T.ruby} />
          </linearGradient>
        </defs>
        <polygon
          points="24,3 44,15 44,33 24,45 4,33 4,15"
          fill="url(#d20g)"
          stroke={T.gold}
          strokeWidth="1.2"
          style={{ filter: `drop-shadow(0 0 10px ${T.purple}80)` }}
        />
        <polygon
          points="24,3 44,15 24,26 4,15"
          fill="rgba(255,255,255,0.08)"
        />
        <text
          x="24" y="30"
          textAnchor="middle"
          fontFamily="'Cinzel', serif"
          fontSize="14"
          fontWeight="700"
          fill={T.gold}
        >
          T
        </text>
      </svg>
    </div>
  )
}

/* ── HP bar ────────────────────────────────────────────────────────────── */
function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const color = pct < 30 ? T.danger : pct < 60 ? T.gold : T.success
  return (
    <div style={{
      marginTop: 6, height: 4,
      background: T.bg, borderRadius: 2,
      overflow: 'hidden',
      border: `1px solid ${T.borderSubtle}`,
    }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: color,
        borderRadius: 2,
        transition: 'width 300ms',
      }} />
    </div>
  )
}

/* ── Character card ────────────────────────────────────────────────────── */
function CharCard({ ch, selected }: { ch: Character; selected: boolean }) {
  const navigate = useNavigate()
  const firstClass = ch.classes[0]
  const portrait = ch.images.character ?? null

  function handleClick() {
    navigate(`/character/${ch.id}`)
  }

  return (
    <button
      onClick={handleClick}
      style={{
        padding: 12, borderRadius: 14,
        background: selected
          ? `linear-gradient(135deg, rgba(212,160,23,0.08), ${T.surface} 55%)`
          : T.surface,
        border: `1px solid ${selected ? 'rgba(212,160,23,0.4)' : T.borderSubtle}`,
        display: 'flex', gap: 12, alignItems: 'center',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 200ms',
        width: '100%',
        boxShadow: selected ? `0 4px 14px rgba(0,0,0,0.35), 0 0 0 0.5px ${T.gold}22` : 'none',
      }}
    >
      {/* Portrait */}
      <div style={{
        width: 56, height: 56, borderRadius: 12, flexShrink: 0,
        background: portrait
          ? `url(${portrait}) center/cover`
          : `
            radial-gradient(circle at 40% 35%, #8B6FC5 0%, transparent 55%),
            radial-gradient(circle at 60% 65%, ${T.ruby} 0%, transparent 55%),
            linear-gradient(135deg, #2A1F3D, #1A0F2A)
          `,
        border: `1.5px solid ${selected ? T.gold : T.borderDefault}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.serif, fontSize: 22, fontWeight: 600,
        color: selected ? T.gold : T.textSecondary,
        boxShadow: selected ? `0 0 14px ${T.gold}30` : 'none',
        position: 'relative',
      }}>
        {!portrait && (ch.name || 'X')[0]}

        {/* Level badge */}
        <div style={{
          position: 'absolute', bottom: -5, right: -5,
          background: T.ruby,
          color: T.textPrimary,
          fontFamily: T.serif, fontWeight: 700,
          width: 20, height: 20, borderRadius: '50%',
          border: `2px solid ${T.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
        }}>
          {ch.totalLevel || '?'}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.serif, fontSize: 15, fontWeight: 600,
          color: T.textPrimary, lineHeight: 1.15,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {ch.name}
        </div>
        <div style={{
          fontSize: 11, color: T.textTertiary, marginTop: 3,
          display: 'flex', gap: 5, alignItems: 'center',
        }}>
          <span>{ch.race || '—'}</span>
          <span style={{ color: T.borderDefault }}>·</span>
          <span style={{ color: T.textSecondary }}>
            {firstClass?.name || '—'} {ch.totalLevel || ''}
          </span>
        </div>
        <HpBar current={ch.hp.current} max={ch.hp.max} />
      </div>

      {/* HP display */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 9, color: T.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600,
        }}>
          HP
        </div>
        <div style={{
          fontFamily: T.serif, fontWeight: 600,
          color: T.textPrimary, fontSize: 14,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, marginTop: 2,
        }}>
          {ch.hp.current}
          <span style={{ color: T.textMuted, fontSize: 11 }}>/{ch.hp.max}</span>
        </div>
      </div>
    </button>
  )
}

/* ── Auth strip ────────────────────────────────────────────────────────── */
function AuthStrip() {
  const navigate                   = useNavigate()
  const { user, loading, signOut } = useAuthStore()

  if (loading) return null

  if (user) {
    return (
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        marginTop: 14, paddingTop: 14,
        borderTop: `1px solid ${T.borderSubtle}`,
        fontSize: 12, color: T.textMuted,
      }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </span>
        <button
          onClick={signOut}
          style={{
            background: 'transparent',
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 11, fontWeight: 600,
            color: T.textTertiary,
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', gap: 6, marginTop: 14,
      paddingTop: 14,
      borderTop: `1px solid ${T.borderSubtle}`,
    }}>
      <button
        onClick={() => navigate('/login')}
        style={{
          flex: 1,
          background: T.purple,
          border: 'none',
          borderRadius: 8,
          padding: '9px',
          fontSize: 11, fontWeight: 600,
          color: T.textPrimary,
          cursor: 'pointer',
        }}
      >
        Entrar
      </button>
      <button
        onClick={() => navigate('/login')}
        style={{
          flex: 1, background: 'transparent',
          border: `1px solid ${T.borderSubtle}`,
          color: T.textSecondary, borderRadius: 8,
          padding: '9px', fontSize: 11, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Criar conta
      </button>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function CharSelect() {
  const { characters, loading, fetchCharacters } = useCharactersStore()

  useEffect(() => {
    void fetchCharacters()
  }, [fetchCharacters])

  return (
    <div style={{
      background: `
        radial-gradient(ellipse at top, rgba(91,63,168,0.18), transparent 55%),
        radial-gradient(ellipse at 80% 90%, rgba(139,26,46,0.12), transparent 55%),
        ${T.bg}
      `,
      minHeight: '100dvh',
      color: T.textPrimary,
      fontFamily: T.sans,
    }}>
      {/* ── Hero ── */}
      <div style={{
        padding: '74px 18px 22px',
        position: 'relative',
        overflow: 'hidden',
      }} className="noise-grain">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <D20Logo />
          <div>
            <div style={{
              fontFamily: T.serif,
              fontSize: 22, fontWeight: 700,
              color: T.textPrimary,
              letterSpacing: '3px', lineHeight: 1,
            }}>
              TBT<span style={{ color: T.gold }}>·</span>RPG
            </div>
            <div style={{
              fontSize: 10, color: T.textMuted,
              letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4,
            }}>
              Mesa virtual · fichas sincronizadas
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{
          fontFamily: T.serif,
          fontSize: 28, fontWeight: 600,
          lineHeight: 1.15,
          color: T.textPrimary,
          letterSpacing: 0.3,
          marginBottom: 10,
        }}>
          Sua ficha,<br />
          <span style={{
            background: `linear-gradient(90deg, ${T.gold}, #F2D06B)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            facilitada.
          </span>
        </div>
        <div style={{
          fontSize: 13, color: T.textTertiary,
          lineHeight: 1.55, maxWidth: 320,
        }}>
          Gerencie seus personagens de D&amp;D em qualquer dispositivo.
          HP, magias e inventário a um toque.
        </div>

        {/* v2 badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 14,
          background: 'rgba(91,63,168,0.18)',
          border: '1px solid rgba(91,63,168,0.4)',
          borderRadius: 20,
          padding: '4px 10px',
          fontSize: 10, fontWeight: 600,
          color: '#9B8ED4',
          letterSpacing: 1, textTransform: 'uppercase',
        }}>
          v2 · Preview
        </div>

        {/* Ornament */}
        <div style={{
          position: 'absolute', top: 10, right: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.purple}40, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Character list ── */}
      <div style={{ padding: '0 14px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          marginBottom: 10, paddingTop: 16,
          borderTop: `1px solid ${T.borderSubtle}`,
        }}>
          <div>
            <div style={{
              fontFamily: T.serif,
              fontSize: 11, fontWeight: 600,
              letterSpacing: 2, textTransform: 'uppercase',
              color: T.textMuted,
            }}>
              Meus Personagens
            </div>
            <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>
              {loading ? 'Carregando…' : `${characters.length} salvos`}
            </div>
          </div>
          <span style={{ flex: 1 }} />
          <button
            onClick={() => void fetchCharacters()}
            style={{
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textTertiary,
              fontSize: 11, fontWeight: 600,
              padding: '6px 10px', borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ↺
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && (
            <div style={{
              padding: 20, textAlign: 'center',
              color: T.textMuted, fontSize: 13,
            }}>
              Carregando personagens…
            </div>
          )}

          {!loading && characters.length === 0 && (
            <div style={{
              padding: 24, textAlign: 'center',
              color: T.textMuted, fontSize: 13,
              border: `1px dashed ${T.borderSubtle}`,
              borderRadius: 14,
            }}>
              Nenhum personagem encontrado.<br />
              <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                Crie um na <a href={V1_URL} style={{ color: T.gold }}>v1</a> e ele aparecerá aqui.
              </span>
            </div>
          )}

          {!loading && characters.map((ch, i) => (
            <CharCard key={ch.id} ch={ch} selected={i === 0} />
          ))}

          {/* Create new — stub */}
          <button
            onClick={() => alert('Criação de personagens ainda não implementada na v2.\nUse a v1: ' + V1_URL)}
            style={{
              padding: '16px', borderRadius: 14,
              background: 'transparent',
              border: `2px dashed ${T.borderDefault}`,
              color: T.textTertiary,
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 18, color: T.gold }}>＋</span>
            Criar novo personagem
          </button>
        </div>

        {/* Secondary actions */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 14,
          paddingTop: 14, borderTop: `1px solid ${T.borderSubtle}`,
        }}>
          <button
            onClick={() => alert('Importar JSON — não implementado na v2 ainda.')}
            style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textSecondary, borderRadius: 8,
              padding: '9px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            ⬇ Importar JSON
          </button>
          <button
            onClick={() => alert('Exportar — não implementado na v2 ainda.')}
            style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textSecondary, borderRadius: 8,
              padding: '9px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            ⬆ Exportar
          </button>
        </div>

        {/* v1 link */}
        <div style={{
          marginTop: 14, textAlign: 'center',
          fontSize: 11, color: T.textMuted,
        }}>
          Ficha completa disponível na{' '}
          <a href={V1_URL} style={{ color: T.gold, textDecoration: 'none' }}>
            versão atual (v1) →
          </a>
        </div>

        {/* Auth */}
        <AuthStrip />
      </div>
    </div>
  )
}
