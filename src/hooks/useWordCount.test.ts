import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWordCount } from './useWordCount'

describe('useWordCount', () => {
  it('returns 0 for empty string', () => {
    const { result } = renderHook(() => useWordCount(''))
    expect(result.current).toBe(0)
  })

  it('returns 0 for whitespace only', () => {
    const { result } = renderHook(() => useWordCount('   \n  '))
    expect(result.current).toBe(0)
  })

  it('counts single word', () => {
    const { result } = renderHook(() => useWordCount('hello'))
    expect(result.current).toBe(1)
  })

  it('counts multiple words', () => {
    const { result } = renderHook(() => useWordCount('hello world today'))
    expect(result.current).toBe(3)
  })

  it('handles multiple spaces between words', () => {
    const { result } = renderHook(() => useWordCount('hello   world'))
    expect(result.current).toBe(2)
  })

  it('handles newlines', () => {
    const { result } = renderHook(() => useWordCount('first line\nsecond line'))
    expect(result.current).toBe(4)
  })
})
