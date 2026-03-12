import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AutoSaveStatus } from './AutoSaveStatus'

describe('AutoSaveStatus', () => {
  it('shows "Saving…" when status is saving', () => {
    render(<AutoSaveStatus status="saving" />)
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('shows "Saved" when status is saved', () => {
    render(<AutoSaveStatus status="saved" />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('shows error message when status is error', () => {
    render(<AutoSaveStatus status="error" />)
    expect(screen.getByText('Failed to save')).toBeInTheDocument()
  })

  it('has aria-live polite for screen readers', () => {
    render(<AutoSaveStatus status="saved" />)
    expect(screen.getByText('Saved')).toHaveAttribute('aria-live', 'polite')
  })
})
