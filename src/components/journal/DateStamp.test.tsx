import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DateStamp } from './DateStamp'

describe('DateStamp', () => {
  const isoDate = '2024-06-15T10:00:00Z'

  it('renders a time element', () => {
    render(<DateStamp date={isoDate} />)
    expect(screen.getByRole('time')).toBeInTheDocument()
  })

  it('sets dateTime attribute to ISO string', () => {
    render(<DateStamp date={isoDate} />)
    expect(screen.getByRole('time')).toHaveAttribute('dateTime')
  })

  it('formats relative — today', () => {
    render(<DateStamp date={new Date().toISOString()} format="relative" />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('accepts a Date object', () => {
    render(<DateStamp date={new Date(isoDate)} />)
    expect(screen.getByRole('time')).toBeInTheDocument()
  })
})
