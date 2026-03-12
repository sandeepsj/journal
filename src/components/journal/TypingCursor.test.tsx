import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TypingCursor } from './TypingCursor'

describe('TypingCursor', () => {
  it('renders when visible', () => {
    const { container } = render(<TypingCursor visible />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders nothing when not visible', () => {
    const { container } = render(<TypingCursor visible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('is hidden from screen readers', () => {
    const { container } = render(<TypingCursor />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
