import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { PinnedRail } from './PinnedRail'

const baseEntries = [
  { id: '1', title: 'A quiet morning by the window', mood: 'calm' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: '2', title: 'Best day in a long time', mood: 'happy' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
  { id: '3', title: 'Things I am grateful for today', mood: 'grateful' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString() },
  { id: '4', title: 'Rainy afternoon thoughts', mood: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString() },
  { id: '5', title: 'End of a long week', mood: 'calm' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString() },
]

const meta = {
  component: PinnedRail,
  tags: ['autodocs'],
  args: {
    onEntryClick: fn(),
    onUnpin: fn(),
  },
} satisfies Meta<typeof PinnedRail>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { entries: [], isLoading: true },
}

export const WithEntries: Story = {
  args: { entries: baseEntries, isLoading: false },
}

export const SingleEntry: Story = {
  args: { entries: [baseEntries[0]], isLoading: false },
}
