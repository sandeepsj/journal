import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardView } from './DashboardView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock the hook so we don't need real API calls
vi.mock('@/hooks/useJournalEntries', () => ({
  useJournalEntries: vi.fn(),
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
}

beforeEach(() => {
  vi.mocked(useJournalEntries).mockReturnValue(defaultHook)
})

describe('DashboardView', () => {
  it('renders greeting with user name', () => {
    render(<DashboardView userName="Jane Doe" />)
    expect(screen.getByText(/Jane/)).toBeInTheDocument()
  })

  it('renders the recall panel', () => {
    render(<DashboardView userName="Jane" />)
    expect(screen.getByRole('textbox', { name: /ask your journal/i })).toBeInTheDocument()
  })

  it('renders journal entries', () => {
    render(<DashboardView userName="Jane" />)
    expect(screen.getByText('Morning walk')).toBeInTheDocument()
  })

  it('shows new entry button', () => {
    render(<DashboardView userName="Jane" />)
    expect(screen.getByRole('button', { name: /new journal entry/i })).toBeInTheDocument()
  })

  it('shows empty state when no entries', () => {
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, entries: [] })
    render(<DashboardView userName="Jane" />)
    expect(screen.getByText(/Your story starts here/)).toBeInTheDocument()
  })

  it('shows search-specific empty state when searching', async () => {
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, entries: [] })
    render(<DashboardView userName="Jane" />)
    await userEvent.type(screen.getByPlaceholderText(/Search your entries/i), 'morning')
    await waitFor(() => {
      expect(screen.getByText(/No entries found/)).toBeInTheDocument()
    })
  })

  it('opens delete confirmation modal on delete click', async () => {
    render(<DashboardView userName="Jane" />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    expect(screen.getByText(/permanently deleted/i)).toBeInTheDocument()
  })

  it('calls deleteEntry after confirming delete', async () => {
    const deleteEntry = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, deleteEntry })
    render(<DashboardView userName="Jane" />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(deleteEntry).toHaveBeenCalledWith('1')
  })

  it('shows load more button when hasMore is true', () => {
    vi.mocked(useJournalEntries).mockReturnValue({ ...defaultHook, hasMore: true })
    render(<DashboardView userName="Jane" />)
    expect(screen.getByRole('button', { name: /Load more/i })).toBeInTheDocument()
  })

  it('shows error state', () => {
    vi.mocked(useJournalEntries).mockReturnValue({
      ...defaultHook,
      entries: [],
      error: 'Failed to load entries',
    })
    render(<DashboardView userName="Jane" />)
    expect(screen.getByText('Failed to load entries')).toBeInTheDocument()
  })
})
