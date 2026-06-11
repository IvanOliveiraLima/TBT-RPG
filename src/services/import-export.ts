import type { Character } from '@/domain/character'
import { useCharactersStore } from '@/store/characters'

export const EXPORT_SCHEMA_VERSION = 10

export interface ExportPayload {
  schema_version: number
  exported_at: string
  count: number
  characters: Character[]
}

export class ImportError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
    this.name = 'ImportError'
  }
}

export function buildExportBlob(characters: Character[]): { blob: Blob; filename: string } {
  const payload: ExportPayload = {
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    count: characters.length,
    characters,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  const date = new Date().toISOString().split('T')[0]
  const filename = `tbt-rpg-export-${date}.json`

  return { blob, filename }
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function parseImportFile(file: File): Promise<ExportPayload> {
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new ImportError('read_failed')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new ImportError('invalid_json')
  }

  if (!isExportPayload(parsed)) {
    throw new ImportError('invalid_schema')
  }

  if (parsed.schema_version !== EXPORT_SCHEMA_VERSION) {
    throw new ImportError('incompatible_version')
  }

  return parsed
}

function isExportPayload(obj: unknown): obj is ExportPayload {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.schema_version === 'number' &&
    typeof o.exported_at === 'string' &&
    typeof o.count === 'number' &&
    Array.isArray(o.characters)
  )
}

export async function applyImport(
  characters: Character[],
  mode: 'merge' | 'replace'
): Promise<{ imported: number; replaced: number }> {
  const store = useCharactersStore.getState()

  if (mode === 'replace') {
    const existing = [...store.characters]
    for (const c of existing) {
      await store.deleteCharacter(c.id)
    }
    for (const c of characters) {
      await store.addCharacter(c)
    }
    return { imported: characters.length, replaced: existing.length }
  }

  // merge
  let updated = 0
  let added = 0

  for (const c of characters) {
    const exists = store.characters.find(x => x.id === c.id)
    if (exists) {
      await store.updateCharacter(c.id, c)
      updated++
    } else {
      await store.addCharacter(c)
      added++
    }
  }

  return { imported: added, replaced: updated }
}
