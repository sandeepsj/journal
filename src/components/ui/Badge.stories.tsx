import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta = {
  component: Badge,
  tags: ['autodocs'],
  args: { label: 'Tag' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Calm: Story = { args: { label: 'Calm', variant: 'calm' } }
export const Happy: Story = { args: { label: 'Happy', variant: 'happy' } }
export const Grateful: Story = { args: { label: 'Grateful', variant: 'grateful' } }
export const Anxious: Story = { args: { label: 'Anxious', variant: 'anxious' } }
export const Sad: Story = { args: { label: 'Sad', variant: 'sad' } }
