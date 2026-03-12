import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock next/image to avoid hostname config errors in unit tests
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) =>
    React.createElement('img', props),
}))
