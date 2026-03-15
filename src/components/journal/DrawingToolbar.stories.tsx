import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DrawingToolbar } from './DrawingToolbar'

const meta = {
  component: DrawingToolbar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DrawingToolbar>

export default meta
type Story = StoryObj<typeof meta>

function ToolbarWrapper(initial: { mode?: 'write' | 'draw' }) {
  return function Wrapper() {
    const [mode, setMode] = useState<'write' | 'draw'>(initial.mode ?? 'write')
    const [textColor, setTextColor] = useState('#2C2825')
    const [brushColor, setBrushColor] = useState('#2C2825')
    const [brushSize, setBrushSize] = useState(2)
    const [erasing, setErasing] = useState(false)

    return (
      <DrawingToolbar
        mode={mode}
        onModeChange={setMode}
        textColor={textColor}
        onTextColorChange={setTextColor}
        brushColor={brushColor}
        onBrushColorChange={setBrushColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        erasing={erasing}
        onErasingChange={setErasing}
        onClearDrawing={() => alert('Clear!')}
      />
    )
  }
}

export const WriteMode: Story = {
  render: ToolbarWrapper({ mode: 'write' }),
}

export const DrawMode: Story = {
  render: ToolbarWrapper({ mode: 'draw' }),
}
