export interface Campaign {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteCode: string
  createdAt: number
  updatedAt: number
}

export interface CampaignMember {
  campaignId: string
  userId: string
  role: 'master' | 'player'
  joinedAt: number
}

export interface UserProfile {
  userId: string
  displayName: string
  createdAt: number
  updatedAt: number
}

export interface CampaignCharacter {
  campaignId: string
  characterId: string
  userId: string
  characterName: string
  characterSummary: string | null
  addedAt: number
}

export function buildCharacterSummary(char: {
  race?: string
  classes?: Array<{ name: string; level: number }>
}): string {
  const parts: string[] = []
  if (char.race) parts.push(char.race)
  if (char.classes && char.classes.length > 0) {
    const classStr = char.classes.map(c => `${c.name} ${c.level}`).join(' / ')
    parts.push(classStr)
  }
  return parts.join(' — ')
}

