import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { MoodSelector } from './MoodSelector'

const meta = {
  component: MoodSelector,
  tags: ['autodocs'],
  args: { value: null, onChange: fn() },
} satisfies Meta<typeof MoodSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const CalmSelected: Story = { args: { value: 'calm' } }
export const HappySelected: Story = { args: { value: 'happy' } }
export const AnxiousSelected: Story = { args: { value: 'anxious' } }
