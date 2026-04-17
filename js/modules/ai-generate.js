// URL do Worker — substitua pela URL gerada após o deploy
const WORKER_URL = 'https://dnd-ai-worker.ivanoliveira-estudos.workers.dev'

export async function generateCharacter(description, lang = 'en') {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, lang })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  return data.character
}
