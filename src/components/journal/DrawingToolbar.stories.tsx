import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DrawingToolbar } from './DrawingToolbar'

// Self-contained wrappers manage all state internally — no required Storybook args
function WriteModeWrapper() {
  const [mode, setMode] = useState<'write' | 'draw'>('write')
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
      canUndo={false}
      canRedo={false}
      onUndo={() => {}}
      onRedo={() => {}}
    />
  )
}

function DrawModeWrapper() {
  const [mode, setMode] = useState<'write' | 'draw'>('draw')
  const [textColor, setTextColor] = useState('#2C2825')
  const [brushColor, setBrushColor] = useState('#7C9E8A')
  const [brushSize, setBrushSize] = useState(3)
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
      canUndo={false}
      canRedo={false}
      onUndo={() => {}}
      onRedo={() => {}}
    />
  )
}

const meta = {
  title: 'Journal/DrawingToolbar',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const WriteMode: Story = {
  render: () => <WriteModeWrapper />,
}

export const DrawMode: Story = {
  render: () => <DrawModeWrapper />,
}
