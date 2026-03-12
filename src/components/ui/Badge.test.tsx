import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders label', () => {
    render(<Badge label="Calm" />)
    expect(screen.getByText('Calm')).toBeInTheDocument()
  })

  it('applies mood variant class', () => {
    const { container } = render(<Badge label="Happy" variant="happy" />)
    expect(container.firstChild).toHaveClass('bg-[#FFF8E6]')
  })

  it('applies default variant when none given', () => {
    const { container } = render(<Badge label="Tag" />)
    expect(container.firstChild).toHaveClass('bg-[#F2EEE8]')
  })
})
