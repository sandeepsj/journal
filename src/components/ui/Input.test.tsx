import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input id="name" label="Full name" />)
    expect(screen.getByLabelText('Full name')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input id="email" label="Email" error="Invalid email" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows hint when no error', () => {
    render(<Input id="email" hint="Enter your email" />)
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
  })

  it('does not show hint when error is present', () => {
    render(<Input id="email" error="Error" hint="Hint" />)
    expect(screen.queryByText('Hint')).not.toBeInTheDocument()
  })

  it('associates error with input via aria-describedby', () => {
    render(<Input id="email" error="Bad input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'email-error')
  })
})
