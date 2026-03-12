import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { SearchInput } from './SearchInput'

const meta = {
  component: SearchInput,
  tags: ['autodocs'],
  args: { value: '', onChange: fn(), onClear: fn() },
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const WithValue: Story = { args: { value: 'morning walk' } }
export const CustomPlaceholder: Story = { args: { placeholder: 'Search your memories…' } }
