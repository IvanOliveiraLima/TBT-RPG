import { translateFields } from './ai-generate.js'

let translating = false

const TRANSLATABLE_FIELDS = [
  { selector: '#page-1 #proficiencies #weapons-armor textarea[name="weapons-armor"]', key: 'weapons_armor' },
  { selector: '#page-1 #proficiencies #tools textarea[name="tools"]', key: 'tools' },
  { selector: '#page-1 #proficiencies #languages textarea[name="languages"]', key: 'languages' },
  { selector: '#page-1 #features textarea[name="features"]', key: 'features' },
  { selector: '#personality #personality-traits textarea[name="personality-traits"]', key: 'personality_traits' },
  { selector: '#personality #ideals textarea[name="ideals"]', key: 'ideals' },
  { selector: '#personality #bonds textarea[name="bonds"]', key: 'bonds' },
  { selector: '#personality #flaws textarea[name="flaws"]', key: 'flaws' },
  { selector: '#page-4 #backstory textarea[name="backstory"]', key: 'backstory' },
  { selector: '#page-4 #allies-organizations textarea[name="allies-organizations"]', key: 'allies' },
  { selector: '#page-5 #notes-1 textarea[name="notes-1"]', key: 'notes_1' },
  { selector: '#page-5 #notes-2 textarea[name="notes-2"]', key: 'notes_2' },
]

export async function translateSheet(targetLang) {
  if (translating) return
  translating = true
  const btn = document.getElementById('translate-fields-btn')
  if (btn) btn.textContent = '🌐 Translating...'

  try {
    const texts = {}
    const fieldMap = {}

    for (const field of TRANSLATABLE_FIELDS) {
      const el = document.querySelector(field.selector)
      if (el && el.value.trim()) {
        texts[field.key] = el.value.trim()
        fieldMap[field.key] = el
      }
    }

    if (Object.keys(texts).length === 0) {
      if (window.showSheetFeedback) window.showSheetFeedback(
        targetLang === 'pt' ? 'Nenhum campo para traduzir' : 'No fields to translate'
      )
      return
    }

    if (window.showSheetFeedback) window.showSheetFeedback(
      targetLang === 'pt' ? 'Traduzindo...' : 'Translating...'
    )

    const translated = await translateFields(texts, targetLang)

    for (const [key, value] of Object.entries(translated)) {
      if (fieldMap[key] && value) {
        fieldMap[key].value = value
        fieldMap[key].dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    document.dispatchEvent(new Event('sheetChanged'))

    if (window.showSheetFeedback) window.showSheetFeedback(
      targetLang === 'pt' ? 'Campos traduzidos!' : 'Fields translated!'
    )
  } catch (err) {
    if (window.showSheetFeedback) window.showSheetFeedback(
      err.message || (targetLang === 'pt' ? 'Falha na tradução' : 'Translation failed')
    )
  } finally {
    translating = false
    if (btn) btn.textContent = '🌐 Translate fields'
  }
}
