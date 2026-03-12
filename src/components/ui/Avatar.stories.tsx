import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta = {
  component: Avatar,
  tags: ['autodocs'],
  args: { name: 'Jane Doe' },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithInitials: Story = {}
export const Small: Story = { args: { size: 'sm' } }
export const Large: Story = { args: { size: 'lg' } }
export const WithImage: Story = {
  args: { src: 'https://i.pravatar.cc/96?img=1', name: 'Jane Doe' },
}
export const LongName: Story = { args: { name: 'Alexander Pemberton-Hughes' } }
