import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { EmptyState } from './EmptyState'

const meta = {
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithAction: Story = {
  args: { action: { label: 'Write your first entry', onClick: fn() } },
}
export const CustomText: Story = {
  args: {
    title: 'No entries found',
    description: 'Try adjusting your search or filters.',
  },
}
