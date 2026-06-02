export interface Campaign {
  id: string
  name: string
  description: string | null
  ownerId: string
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

export function isMaster(member: CampaignMember | null | undefined): boolean {
  return member?.role === 'master'
}
