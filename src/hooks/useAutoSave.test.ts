import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutoSave } from './useAutoSave'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoSave', () => {
  it('starts with idle status', () => {
    const { result } = renderHook(() =>
      useAutoSave({ data: 'initial', onSave: vi.fn(), interval: 5000 })
    )
    expect(result.current.status).toBe('idle')
  })

  it('does not call save on first render (not dirty)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useAutoSave({ data: 'initial', onSave, interval: 5000 })
    )
    await act(async () => {
      await result.current.save()
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('sets status to saving then saved on successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, interval: 60000 }),
      { initialProps: { data: 'hello' } }
    )

    // Trigger dirty state
    rerender({ data: 'hello world' })

    await act(async () => {
      await result.current.save()
    })

    expect(result.current.status).toBe('saved')
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('sets error status when save throws', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'))
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, interval: 60000 }),
      { initialProps: { data: 'hello' } }
    )

    rerender({ data: 'hello world' })

    await act(async () => {
      await result.current.save()
    })

    expect(result.current.status).toBe('error')
  })

  it('auto-saves after interval when dirty', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, interval: 5000 }),
      { initialProps: { data: 'hello' } }
    )

    rerender({ data: 'hello world' })

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('does not auto-save when enabled is false', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, interval: 5000, enabled: false }),
      { initialProps: { data: 'hello' } }
    )

    rerender({ data: 'hello world' })

    await act(async () => {
      vi.advanceTimersByTime(10000)
      await Promise.resolve()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('resets to idle after saved status', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, interval: 60000 }),
      { initialProps: { data: 'hello' } }
    )

    rerender({ data: 'hello world' })

    await act(async () => {
      await result.current.save()
    })

    expect(result.current.status).toBe('saved')

    // Advance past the 2500ms reset timer
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.status).toBe('idle')
  })
})
