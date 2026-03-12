import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('shows initials when no src', () => {
    render(<Avatar name="Jane Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows only two initials for long names', () => {
    render(<Avatar name="Alexander Pemberton Hughes" />)
    expect(screen.getByText('AP')).toBeInTheDocument()
  })

  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/photo.jpg" name="Jane Doe" />)
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument()
    expect(screen.queryByText('JD')).not.toBeInTheDocument()
  })

  it('renders initials fallback when src is null', () => {
    render(<Avatar src={null} name="Jane Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })
})
