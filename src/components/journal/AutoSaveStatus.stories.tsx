import type { Meta, StoryObj } from '@storybook/react'
import { AutoSaveStatus } from './AutoSaveStatus'

const meta = {
  component: AutoSaveStatus,
  tags: ['autodocs'],
} satisfies Meta<typeof AutoSaveStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = { args: { status: 'idle' } }
export const Saving: Story = { args: { status: 'saving' } }
export const Saved: Story = { args: { status: 'saved' } }
export const Error: Story = { args: { status: 'error' } }
