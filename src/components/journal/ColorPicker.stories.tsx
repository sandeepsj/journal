import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ColorPicker } from './ColorPicker'

function Wrapper({ initial }: { initial: string }) {
  const [color, setColor] = useState(initial)
  return (
    <div className="flex items-center gap-4 p-6 bg-[#FEFCF8] rounded-xl border border-[#E8E2D9]">
      <ColorPicker value={color} onChange={setColor} label="Ink" />
      <span className="text-sm font-mono text-[#8B7D72]">{color}</span>
      <div className="w-8 h-8 rounded-full border border-[#E8E2D9]" style={{ backgroundColor: color }} />
    </div>
  )
}

const meta = {
  title: 'Journal/ColorPicker',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Wrapper initial="#2C2825" />,
}

export const SageGreen: Story = {
  render: () => <Wrapper initial="#7C9E8A" />,
}

export const Terracotta: Story = {
  render: () => <Wrapper initial="#C4614E" />,
}
