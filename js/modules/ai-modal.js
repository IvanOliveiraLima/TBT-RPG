import { generateCharacter } from './ai-generate.js'
import { renderClassRows } from '../save.js'

export function openAiModal() {
  const modal = document.getElementById('ai-generate-modal')
  const input = document.getElementById('ai-description-input')
  const error = document.getElementById('ai-generate-error')
  const counter = document.getElementById('ai-char-counter')

  if (input) {
    input.value = ''
    input.addEventListener('input', () => {
      if (counter) counter.textContent = `${input.value.length} / 1000`
    })
  }
  if (error) { error.style.display = 'none'; error.textContent = '' }
  if (counter) counter.textContent = '0 / 1000'
  if (modal) modal.style.display = 'flex'
}

export function closeAiModal() {
  const modal = document.getElementById('ai-generate-modal')
  if (modal) modal.style.display = 'none'
}

export async function runAiGenerate() {
  const description = document.getElementById('ai-description-input')?.value?.trim()
  if (!description || description.length < 10) {
    showError('Please write at least a short description of your character.')
    return
  }

  const btn = document.getElementById('ai-generate-btn')
  const loading = document.getElementById('ai-generate-loading')
  const error = document.getElementById('ai-generate-error')

  btn.disabled = true
  if (loading) loading.style.display = 'inline'
  if (error) error.style.display = 'none'

  try {
    const result = await generateCharacter(description)
    applyGeneratedCharacter(result)
    closeAiModal()
    if (window.showSheetFeedback) window.showSheetFeedback('Character generated! Review and save.')
    document.dispatchEvent(new Event('sheetChanged'))
  } catch (err) {
    showError(err.message || 'Generation failed. Please try again.')
  } finally {
    btn.disabled = false
    if (loading) loading.style.display = 'none'
  }
}

function showError(message) {
  const error = document.getElementById('ai-generate-error')
  if (error) {
    error.textContent = message
    error.style.display = 'block'
  }
}

function set(selector, value) {
  const el = document.querySelector(selector)
  if (el && value !== undefined && value !== null) el.value = String(value)
}

function check(selector, value) {
  const el = document.querySelector(selector)
  if (el) el.checked = Boolean(value)
}

function applyGeneratedCharacter(data) {
  // Basic info
  set('#character-basic-info #basic-info input[name="char-name"]', data.char_name)
  set('#character-basic-info #character-info input[name="race-class"]', data.race)
  set('#character-basic-info #character-info input[name="background"]', data.background)
  set('#character-basic-info #character-info input[name="alignment"]', data.alignment)

  // Classes
  if (Array.isArray(data.classes) && data.classes.length) {
    renderClassRows(data.classes)
  }

  // Ability scores — set value then trigger input for modifier recalculation
  ;['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
    const el = document.querySelector(`#page-1 #attributes input[name="${attr}"]`)
    if (el && data[attr] !== undefined) {
      el.value = String(data[attr])
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  // HP and Speed
  set('#page-1 #status #hit-points input[name="max-health"]', data.max_health)
  set('#page-1 #top-bar input[name="speed"]', data.speed)

  // Skills
  if (data.skills) {
    const skillMap = {
      acrobatics: 'acrobatics-skill', animal_handling: 'animal-handling-skill',
      arcana: 'arcana-skill', athletics: 'athletics-skill',
      deception: 'deception-skill', history: 'history-skill',
      insight: 'insight-skill', intimidation: 'intimidation-skill',
      investigation: 'investigation-skill', medicine: 'medicine-skill',
      nature: 'nature-skill', perception: 'perception-skill',
      performance: 'performance-skill', persuasion: 'persuasion-skill',
      religion: 'religion-skill', sleight_hand: 'sleight-hand-skill',
      stealth: 'stealth-skill', survival: 'survival-skill'
    }
    Object.entries(skillMap).forEach(([key, id]) => {
      check(`#page-1 #saves-skills #skills #${id} input[name="prof"]`, data.skills[key])
    })
  }

  // Proficiencies
  if (data.proficiencies) {
    set('#page-1 #proficiencies #weapons-armor textarea[name="weapons-armor"]', data.proficiencies.weapon_armor)
    set('#page-1 #proficiencies #tools textarea[name="tools"]', data.proficiencies.tools)
    set('#page-1 #proficiencies #languages textarea[name="languages"]', data.proficiencies.languages)
  }

  // Features, personality, backstory
  set('#page-1 #features textarea[name="features"]', data.features)
  set('#personality #personality-traits textarea[name="personality-traits"]', data.personality_traits)
  set('#personality #ideals textarea[name="ideals"]', data.ideals)
  set('#personality #bonds textarea[name="bonds"]', data.bonds)
  set('#personality #flaws textarea[name="flaws"]', data.flaws)
  set('#page-4 #backstory textarea[name="backstory"]', data.backstory)
}
