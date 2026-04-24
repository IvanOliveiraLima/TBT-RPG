import type { ReactNode } from 'react'
import type { Character } from '@/domain/character'
import type { TabKey } from './types'
import { DesktopShell } from './DesktopShell'
import { MobileShell } from './MobileShell'

export type { TabKey }

interface SheetLayoutProps {
  character: Character
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  children: ReactNode
}

/**
 * Renders both Mobile and Desktop shells in the DOM simultaneously.
 * CSS media queries (Tailwind lg breakpoint) control which is visible.
 * Trade-off: slight DOM duplication, but fully robust across resize events.
 */
export function SheetLayout({ character, activeTab, onTabChange, children }: SheetLayoutProps) {
  return (
    <>
      {/* Mobile: < 1024px */}
      <div className="lg:hidden">
        <MobileShell character={character} activeTab={activeTab} onTabChange={onTabChange}>
          {children}
        </MobileShell>
      </div>

      {/* Desktop: >= 1024px */}
      <div className="hidden lg:block">
        <DesktopShell character={character} activeTab={activeTab} onTabChange={onTabChange}>
          {children}
        </DesktopShell>
      </div>
    </>
  )
}
