import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoodSelector } from './MoodSelector'

describe('MoodSelector', () => {
  it('renders all mood buttons', () => {
    render(<MoodSelector value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Calm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Happy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Grateful' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anxious' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sad' })).toBeInTheDocument()
  })

  it('marks selected mood as pressed', () => {
    render(<MoodSelector value="calm" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Calm' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Happy' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with mood when clicked', async () => {
    const onChange = vi.fn()
    render(<MoodSelector value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Happy' }))
    expect(onChange).toHaveBeenCalledWith('happy')
  })

  it('calls onChange with null when selected mood is clicked again', async () => {
    const onChange = vi.fn()
    render(<MoodSelector value="happy" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Happy' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
