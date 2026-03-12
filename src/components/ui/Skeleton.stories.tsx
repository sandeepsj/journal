import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './Skeleton'
import { JournalCardSkeleton } from '@/components/journal/JournalCardSkeleton'

const meta = {
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = { args: { className: 'h-4 w-48' } }
export const Circle: Story = { args: { className: 'h-10 w-10', rounded: 'full' } }
export const Block: Story = { args: { className: 'h-24 w-full' } }
export const CardSkeleton: Story = {
  render: () => (
    <div className="max-w-sm">
      <JournalCardSkeleton />
    </div>
  ),
}
