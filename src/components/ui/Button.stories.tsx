import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Button' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Danger: Story = { args: { variant: 'danger' } }
export const Small: Story = { args: { size: 'sm' } }
export const Large: Story = { args: { size: 'lg' } }
export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }
export const FullWidth: Story = { args: { fullWidth: true } }
