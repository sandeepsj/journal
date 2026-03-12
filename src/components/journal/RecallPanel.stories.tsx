import type { Meta, StoryObj } from '@storybook/react'
import { RecallPanel } from './RecallPanel'

const meta = {
  component: RecallPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RecallPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
