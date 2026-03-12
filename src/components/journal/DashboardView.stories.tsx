import type { Meta, StoryObj } from '@storybook/react'
import { DashboardView } from './DashboardView'

const meta = {
  component: DashboardView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { userName: 'Jane Doe' },
} satisfies Meta<typeof DashboardView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
