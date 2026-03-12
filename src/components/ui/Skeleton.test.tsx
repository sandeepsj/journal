import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies aria-hidden', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('applies full rounded class', () => {
    const { container } = render(<Skeleton rounded="full" />)
    expect(container.firstChild).toHaveClass('rounded-full')
  })

  it('applies additional className', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-24')
  })
})
