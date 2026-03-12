import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput value="" onChange={vi.fn()} placeholder="Search…" />)
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument()
  })

  it('calls onChange when typed', async () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('searchbox'), 'hello')
    expect(onChange).toHaveBeenCalled()
  })

  it('shows clear button when value is non-empty', () => {
    render(<SearchInput value="morning" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })

  it('does not show clear button when value is empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('calls onChange with empty string when cleared', async () => {
    const onChange = vi.fn()
    render(<SearchInput value="morning" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
