import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { PinLimitBanner } from './PinLimitBanner'

const meta = {
  component: PinLimitBanner,
  tags: ['autodocs'],
  args: {
    message: 'You can pin up to 10 entries. Unpin one to continue.',
    onDismiss: fn(),
  },
} satisfies Meta<typeof PinLimitBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
