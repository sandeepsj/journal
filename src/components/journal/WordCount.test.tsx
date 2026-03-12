import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WordCount } from './WordCount'

describe('WordCount', () => {
  it('shows word count', () => {
    render(<WordCount count={312} />)
    expect(screen.getByText(/312/)).toBeInTheDocument()
  })

  it('uses singular "word" for count of 1', () => {
    render(<WordCount count={1} />)
    expect(screen.getByText(/1 word$/)).toBeInTheDocument()
  })

  it('shows max when provided', () => {
    render(<WordCount count={50} max={500} />)
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })

  it('has aria-live polite', () => {
    const { container } = render(<WordCount count={10} />)
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite')
  })
})
