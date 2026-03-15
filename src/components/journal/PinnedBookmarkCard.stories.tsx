import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { PinnedBookmarkCard } from './PinnedBookmarkCard'

const meta = {
  component: PinnedBookmarkCard,
  tags: ['autodocs'],
  args: {
    id: '1',
    title: 'A quiet morning by the window',
    mood: 'calm',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    onClick: fn(),
    onUnpin: fn(),
  },
} satisfies Meta<typeof PinnedBookmarkCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoMood: Story = { args: { mood: null } }

export const Happy: Story = {
  args: { mood: 'happy', title: 'Best day in a long time' },
}

export const LongTitle: Story = {
  args: {
    title:
      'This is a very long journal entry title that goes well beyond two lines and should be clamped. The text continues for quite a while to test the clamp behavior in the card.',
  },
}
