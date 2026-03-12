import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta = {
  component: Input,
  tags: ['autodocs'],
  args: { id: 'demo', placeholder: 'Type something…' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithLabel: Story = { args: { label: 'Your name' } }
export const WithHint: Story = { args: { label: 'Email', hint: 'We will never share your email.' } }
export const WithError: Story = { args: { label: 'Email', error: 'This field is required.' } }
export const Disabled: Story = { args: { label: 'Name', disabled: true, value: 'Read only' } }
