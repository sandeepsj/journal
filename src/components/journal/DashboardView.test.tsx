import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DashboardView } from './DashboardView'

// Mock the hooks so we don't need real API/Drive calls
vi.mock('@/hooks/useJournalEntries', () => ({
  useJournalEntries: vi.fn(),
}))

vi.mock('@/hooks/usePinnedEntries', () => ({
  usePinnedEntries: () => ({
    pinnedEntries: [],
    isLoading: false,
    pinError: null,
    clearPinError: vi.fn(),
    togglePin: vi.fn(),
  }),
}))

import { useJournalEntries } from '@/hooks/useJournalEntries'

const mockEntries = [
  {
    id: '1',
    title: 'Morning walk',
    excerpt: 'A quiet walk through the park.',
    mood: 'calm' as const,
    createdAt: new Date().toISOString(),
    wordCount: 50,
    updatedAt: new Date().toISOString(),
    pinned: false,
  },
]

const defaultHook = {
  entries: mockEntries,
  isLoading: false,
  error: null,
  hasMore: false,
  loadMore: vi.fn(),
  deleteEntry: vi.fn(),
  refresh: vi.fn(),
  setPinned: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useJournalEntries).mockReturnValue(defaultHook)
})

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('DashboardView', () => {
  it('renders greeting with user name', () => {
    renderWithRouter(<DashboardView userName="Jane Doe" />)
    expect(screen.getByText(/Jane/)).toBeInTheDocument()
  })

  it('renders journal entries', () => {
    renderWithRouter(<DashboardView userName="Jane" />)
    expect(screen.getByText('Morning walk')).toBeInTheDocument()
  })

  it('shows new entry button', () => {
    renderWithRouter(<DashboardView userName="Jane" />)
    expect(screen.getByRole('button', { name: /new journal entry/i })).toBeInTheDocument()
  })

  it('shows empty state when no entries', () => {
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, entries: [] })
    renderWithRouter(<DashboardView userName="Jane" />)
    expect(screen.getByText(/Your story starts here/)).toBeInTheDocument()
  })

  it('shows search-specific empty state when searching', async () => {
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, entries: [] })
    renderWithRouter(<DashboardView userName="Jane" />)
    await userEvent.type(screen.getByPlaceholderText(/Search your entries/i), 'morning')
    await waitFor(() => {
      expect(screen.getByText(/No entries found/)).toBeInTheDocument()
    })
  })

  it('opens delete confirmation modal on delete click', async () => {
    renderWithRouter(<DashboardView userName="Jane" />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    expect(screen.getByText(/permanently deleted/i)).toBeInTheDocument()
  })

  it('calls deleteEntry after confirming delete', async () => {
    const deleteEntry = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, deleteEntry })
    renderWithRouter(<DashboardView userName="Jane" />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(deleteEntry).toHaveBeenCalledWith('1')
  })

  it('shows load more button when hasMore is true', () => {
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, hasMore: true })
    renderWithRouter(<DashboardView userName="Jane" />)
    expect(screen.getByRole('button', { name: /Load more/i })).toBeInTheDocument()
  })

  it('shows error state', () => {
    vi.mocked(useJournalEntries).mockReturnValue({
      ...defaultHook,
      entries: [],
      error: 'Failed to load entries',
    })
    renderWithRouter(<DashboardView userName="Jane" />)
    expect(screen.getByText('Failed to load entries')).toBeInTheDocument()
  })
})
