import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalCard } from './JournalCard'

const base = {
  id: '1',
  title: 'My morning',
  excerpt: 'A quiet start to the day.',
  mood: null as null,
  createdAt: '2024-01-15T08:00:00Z',
  wordCount: 100,
  onClick: vi.fn(),
}

describe('JournalCard', () => {
  it('renders title and excerpt', () => {
    render(<JournalCard {...base} />)
    expect(screen.getByText('My morning')).toBeInTheDocument()
    expect(screen.getByText('A quiet start to the day.')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<JournalCard {...base} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows mood badge when mood provided', () => {
    render(<JournalCard {...base} mood="calm" />)
    expect(screen.getByText('Calm')).toBeInTheDocument()
  })

  it('does not show mood badge when mood is null', () => {
    render(<JournalCard {...base} mood={null} />)
    expect(screen.queryByText('Calm')).not.toBeInTheDocument()
  })

  it('does not show delete button when onDelete not provided', () => {
    render(<JournalCard {...base} />)
    expect(screen.queryByRole('button', { name: 'Delete entry' })).not.toBeInTheDocument()
  })

  it('calls onDelete when delete clicked, without triggering onClick', async () => {
    const onClick = vi.fn()
    const onDelete = vi.fn()
    render(<JournalCard {...base} onClick={onClick} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows word count', () => {
    render(<JournalCard {...base} wordCount={312} />)
    expect(screen.getByText('312 words')).toBeInTheDocument()
  })
})
