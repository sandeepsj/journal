import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { JournalCard } from './JournalCard'

const meta = {
  component: JournalCard,
  tags: ['autodocs'],
  args: {
    id: '1',
    title: 'A quiet morning by the window',
    excerpt:
      'I woke up before the alarm today. The light was soft and amber and I sat with my coffee for a long time just watching the birds.',
    mood: 'calm',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    wordCount: 312,
    onClick: fn(),
  },
} satisfies Meta<typeof JournalCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithDelete: Story = { args: { onDelete: fn() } }
export const NoMood: Story = { args: { mood: null } }
export const Happy: Story = { args: { mood: 'happy', title: 'Best day in a long time' } }
export const LongTitle: Story = {
  args: {
    title: 'This is a very long journal entry title that should be clamped after one line of text',
  },
}
export const Pinned: Story = {
  args: { isPinned: true, onPin: fn(), onDelete: fn() },
}
export const WithPinAndDelete: Story = {
  args: { isPinned: false, onPin: fn(), onDelete: fn() },
}
