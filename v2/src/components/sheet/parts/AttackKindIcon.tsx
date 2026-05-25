import { SwordIcon, BowIcon, SparklesIcon } from '@/components/icons'
import type { AttackKind } from '@/domain/character'

interface AttackKindIconProps {
  kind: AttackKind
  size?: number
  color?: string
}

export function AttackKindIcon({ kind, size, color }: AttackKindIconProps) {
  switch (kind) {
    case 'melee':  return <SwordIcon size={size} color={color} />
    case 'ranged': return <BowIcon size={size} color={color} />
    case 'spell':  return <SparklesIcon size={size} color={color} />
  }
}
