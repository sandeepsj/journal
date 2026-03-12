import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalEditor } from './JournalEditor'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock fetch globally
const mockFetch = vi.fn()
beforeEach(() => {
  global.fetch = mockFetch
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'new-entry-123' }),
  })
})

describe('JournalEditor', () => {
  it('renders title and body inputs', () => {
    render(<JournalEditor />)
    expect(screen.getByRole('textbox', { name: 'Entry title' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Entry body' })).toBeInTheDocument()
  })

  it('renders with initial values', () => {
    render(
      <JournalEditor
        entryId="abc"
        initialTitle="My morning"
        initialBody="A quiet start."
        initialMood="calm"
      />
    )
    expect(screen.getByRole('textbox', { name: 'Entry title' })).toHaveValue('My morning')
    expect(screen.getByRole('textbox', { name: 'Entry body' })).toHaveValue('A quiet start.')
  })

  it('updates word count as user types', async () => {
    render(<JournalEditor />)
    const body = screen.getByRole('textbox', { name: 'Entry body' })
    await userEvent.type(body, 'hello world today')
    expect(screen.getByText(/3 words/)).toBeInTheDocument()
  })

  it('shows mood selector', () => {
    render(<JournalEditor />)
    expect(screen.getByRole('group', { name: 'How are you feeling?' })).toBeInTheDocument()
  })

  it('save button is disabled when editor is empty', () => {
    render(<JournalEditor />)
    expect(screen.getByRole('button', { name: /Save entry/i })).toBeDisabled()
  })

  it('save button is enabled after typing', async () => {
    render(<JournalEditor />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Entry title' }), 'Hello')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save entry/i })).not.toBeDisabled()
    })
  })

  it('shows today date in header', () => {
    render(<JournalEditor />)
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(screen.getByText(today)).toBeInTheDocument()
  })

  it('calls save API when save button clicked', async () => {
    render(<JournalEditor />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Entry title' }), 'Test')
    await userEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/journal', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('uses PUT for existing entry', async () => {
    render(<JournalEditor entryId="existing-id" initialTitle="Old title" initialBody="Old body" />)
    await userEvent.clear(screen.getByRole('textbox', { name: 'Entry title' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Entry title' }), 'New title')
    await userEvent.click(screen.getByRole('button', { name: /Save entry/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/journal/existing-id',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })
})
