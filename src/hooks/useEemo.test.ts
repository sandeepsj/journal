import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEemo } from './useEemo'

const mockFetch = vi.fn()
beforeEach(() => {
  global.fetch = mockFetch
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// Flush all pending timers and micro-task queues
async function flushAll() {
  await act(async () => {
    vi.runAllTimers()
    // Flush promises twice to allow state updates to propagate
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('useEemo', () => {
  it('returns null emotion initially', () => {
    const { result } = renderHook(() => useEemo('', ''))
    expect(result.current.emotion).toBeNull()
    expect(result.current.message).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('does not call API when content is less than 20 chars', async () => {
    renderHook(() => useEemo('Hi', 'Short'))
    await flushAll()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls /api/eemo after 3s debounce with enough content', async () => {
    let resolveFetch!: (v: unknown) => void
    const fetchPromise = new Promise((resolve) => { resolveFetch = resolve })

    mockFetch.mockReturnValueOnce(
      fetchPromise.then(() => ({
        ok: true,
        json: async () => ({ emotion: 'happy', message: null }),
      }))
    )

    const { result } = renderHook(() =>
      useEemo('My day', 'Today was a really wonderful and joyful day overall')
    )

    // Advance past the 3s debounce
    await act(async () => { vi.advanceTimersByTime(3100) })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/eemo',
      expect.objectContaining({ method: 'POST' })
    )

    // Resolve the fetch and flush
    await act(async () => {
      resolveFetch(undefined)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.emotion).toBe('happy')
    expect(result.current.message).toBeNull()
  })

  it('sets message when API returns one', async () => {
    let resolveFetch!: (v: unknown) => void
    const fetchPromise = new Promise((resolve) => { resolveFetch = resolve })

    mockFetch.mockReturnValueOnce(
      fetchPromise.then(() => ({
        ok: true,
        json: async () => ({ emotion: 'sad', message: "I'm here with you." }),
      }))
    )

    const { result } = renderHook(() =>
      useEemo('', 'I feel so lost and hopeless today, nothing is going right')
    )

    await act(async () => { vi.advanceTimersByTime(3100) })

    await act(async () => {
      resolveFetch(undefined)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.emotion).toBe('sad')
    expect(result.current.message).toBe("I'm here with you.")
  })

  it('resets debounce when title/body changes rapidly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ emotion: 'calm', message: null }),
    })

    const { rerender } = renderHook(
      ({ title, body }) => useEemo(title, body),
      { initialProps: { title: 'Hello there world today', body: '' } }
    )

    await act(async () => { vi.advanceTimersByTime(1000) })
    rerender({ title: 'Hello there world today updated', body: '' })
    await act(async () => { vi.advanceTimersByTime(1000) })
    rerender({ title: 'Hello there world today updated again', body: '' })
    await act(async () => {
      vi.advanceTimersByTime(3100)
      await Promise.resolve()
      await Promise.resolve()
    })

    // Should only have been called once (last debounce fires)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('keeps last emotion on API error', async () => {
    let resolveFirst!: (v: unknown) => void
    const firstPromise = new Promise((resolve) => { resolveFirst = resolve })

    mockFetch
      .mockReturnValueOnce(
        firstPromise.then(() => ({
          ok: true,
          json: async () => ({ emotion: 'happy', message: null }),
        }))
      )
      .mockResolvedValueOnce({ ok: false })

    const { result, rerender } = renderHook(
      ({ body }) => useEemo('', body),
      { initialProps: { body: 'Having a great day today overall pretty good' } }
    )

    await act(async () => { vi.advanceTimersByTime(3100) })
    await act(async () => {
      resolveFirst(undefined)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.emotion).toBe('happy')

    rerender({ body: 'Having a great day today overall pretty good and updated now' })
    await act(async () => {
      vi.advanceTimersByTime(3100)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    // Emotion should remain 'happy' (last known) after error
    expect(result.current.emotion).toBe('happy')
  })
})
