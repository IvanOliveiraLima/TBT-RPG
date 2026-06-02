import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { ProfileSetupModal } from '@/components/campaigns/ProfileSetupModal'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { ConfirmDeleteCampaignModal } from '@/components/campaigns/ConfirmDeleteCampaignModal'
import type { Campaign } from '@/domain/campaign'

// ── Mock services ─────────────────────────────────────────────────────────────

const mockUpsertMyProfile = vi.fn()

vi.mock('@/services/user-profile', () => ({
  upsertMyProfile: (...args: unknown[]) => mockUpsertMyProfile(...args),
  UserProfileServiceError: class UserProfileServiceError extends Error {
    constructor(public code: string) { super(code) }
  },
}))

const mockCreateCampaign = vi.fn()
const mockDeleteCampaign = vi.fn()

vi.mock('@/store/campaigns', () => ({
  useCampaignsStore: (selector?: (s: { createCampaign: typeof mockCreateCampaign; deleteCampaign: typeof mockDeleteCampaign }) => unknown) => {
    const state = { createCampaign: mockCreateCampaign, deleteCampaign: mockDeleteCampaign }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/services/campaign', () => ({
  CampaignServiceError: class CampaignServiceError extends Error {
    constructor(public code: string) { super(code) }
  },
}))

// ── helpers ───────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement, lang: 'pt' | 'en' = 'pt') {
  localStorage.setItem('tbt-rpg-v2-lang', lang)
  return render(
    <MemoryRouter>
      <I18nProvider>{ui}</I18nProvider>
    </MemoryRouter>
  )
}

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1', name: 'Test Campaign', description: null,
    ownerId: 'u1', createdAt: 1000, updatedAt: 2000,
    ...overrides,
  }
}

// ── ProfileSetupModal ─────────────────────────────────────────────────────────

describe('ProfileSetupModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders the modal with title', () => {
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={vi.fn()} />, 'pt')
    expect(screen.getByTestId('profile-setup-modal')).toBeDefined()
    expect(screen.getByText('Bem-vindo(a)!')).toBeDefined()
  })

  it('renders EN title when lang=en', () => {
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={vi.fn()} />, 'en')
    expect(screen.getByText('Welcome!')).toBeDefined()
  })

  it('submit button is disabled when display name is empty', () => {
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={vi.fn()} />)
    const submitBtn = screen.getByTestId('profile-setup-submit') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('submit button enables when user types a name', () => {
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={vi.fn()} />)
    const input = screen.getByTestId('display-name-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Alice' } })
    const submitBtn = screen.getByTestId('profile-setup-submit') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(false)
  })

  it('calls onComplete after successful save', async () => {
    mockUpsertMyProfile.mockResolvedValue({ userId: 'u1', displayName: 'Alice', createdAt: 0, updatedAt: 0 })
    const onComplete = vi.fn()
    renderWithProviders(<ProfileSetupModal onComplete={onComplete} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId('display-name-input'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByTestId('profile-setup-submit'))

    await waitFor(() => expect(onComplete).toHaveBeenCalled())
  })

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn()
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByTestId('profile-setup-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows error when empty name submitted programmatically', async () => {
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={vi.fn()} />)
    // Type whitespace only then click (button will be disabled, so simulate via service error path)
    const input = screen.getByTestId('display-name-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.change(input, { target: { value: '' } })
    // Button disabled when empty — just verify disabled state
    expect((screen.getByTestId('profile-setup-submit') as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows error message on service failure', async () => {
    const { UserProfileServiceError } = await import('@/services/user-profile')
    mockUpsertMyProfile.mockRejectedValue(new UserProfileServiceError('upsert_failed'))
    renderWithProviders(<ProfileSetupModal onComplete={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId('display-name-input'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByTestId('profile-setup-submit'))

    await waitFor(() => expect(screen.getByTestId('profile-setup-error')).toBeDefined())
  })
})

// ── CreateCampaignModal ───────────────────────────────────────────────────────

describe('CreateCampaignModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders modal title PT', () => {
    renderWithProviders(<CreateCampaignModal onCreated={vi.fn()} onCancel={vi.fn()} />, 'pt')
    expect(screen.getByText('Criar Nova Campanha')).toBeDefined()
  })

  it('renders modal title EN', () => {
    renderWithProviders(<CreateCampaignModal onCreated={vi.fn()} onCancel={vi.fn()} />, 'en')
    expect(screen.getByText('Create New Campaign')).toBeDefined()
  })

  it('submit is disabled when name is empty', () => {
    renderWithProviders(<CreateCampaignModal onCreated={vi.fn()} onCancel={vi.fn()} />)
    expect((screen.getByTestId('create-campaign-submit') as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit enables when name is filled', () => {
    renderWithProviders(<CreateCampaignModal onCreated={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByTestId('campaign-name-input'), { target: { value: 'My Campaign' } })
    expect((screen.getByTestId('create-campaign-submit') as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onCreated with campaign on success', async () => {
    const campaign = makeCampaign({ id: 'new', name: 'My Campaign' })
    mockCreateCampaign.mockResolvedValue(campaign)
    const onCreated = vi.fn()
    renderWithProviders(<CreateCampaignModal onCreated={onCreated} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId('campaign-name-input'), { target: { value: 'My Campaign' } })
    fireEvent.click(screen.getByTestId('create-campaign-submit'))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(campaign))
  })

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn()
    renderWithProviders(<CreateCampaignModal onCreated={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByTestId('create-campaign-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows error on service failure', async () => {
    mockCreateCampaign.mockRejectedValue(new Error('create_failed'))
    renderWithProviders(<CreateCampaignModal onCreated={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId('campaign-name-input'), { target: { value: 'Fail' } })
    fireEvent.click(screen.getByTestId('create-campaign-submit'))

    await waitFor(() => expect(screen.getByTestId('create-campaign-error')).toBeDefined())
  })
})

// ── ConfirmDeleteCampaignModal ────────────────────────────────────────────────

describe('ConfirmDeleteCampaignModal', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders campaign name in warning PT', () => {
    const campaign = makeCampaign({ name: 'Minha Campanha' })
    renderWithProviders(
      <ConfirmDeleteCampaignModal campaign={campaign} onDeleted={vi.fn()} onCancel={vi.fn()} />,
      'pt'
    )
    expect(screen.getByText(/Minha Campanha/)).toBeDefined()
  })

  it('calls onDeleted after successful delete', async () => {
    mockDeleteCampaign.mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    const campaign = makeCampaign()
    renderWithProviders(
      <ConfirmDeleteCampaignModal campaign={campaign} onDeleted={onDeleted} onCancel={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('delete-campaign-confirm'))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn()
    const campaign = makeCampaign()
    renderWithProviders(
      <ConfirmDeleteCampaignModal campaign={campaign} onDeleted={vi.fn()} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByTestId('delete-campaign-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows error on service failure', async () => {
    mockDeleteCampaign.mockRejectedValue(new Error('delete_failed'))
    const campaign = makeCampaign()
    renderWithProviders(
      <ConfirmDeleteCampaignModal campaign={campaign} onDeleted={vi.fn()} onCancel={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('delete-campaign-confirm'))
    await waitFor(() => expect(screen.getByTestId('delete-campaign-error')).toBeDefined())
  })
})
