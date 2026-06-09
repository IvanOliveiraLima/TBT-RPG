import { createContext, useContext } from 'react'
import type { Character } from '@/domain/character'

/**
 * When true, all sheet components render in fully read-only mode
 * (both permanent and transient fields). Used in CampaignCharacterView.
 */
export const ForceReadOnlyContext = createContext<boolean>(false)

/**
 * Provides a Character loaded from a remote source (not IndexedDB).
 * When non-null, useActiveCharacter() returns this instead of the store.
 */
export const RemoteCharacterContext = createContext<Character | null>(null)

/** True when wrapped in ForceReadOnlyContext.Provider with value={true}. */
export function useIsForceReadOnly(): boolean {
  return useContext(ForceReadOnlyContext)
}
