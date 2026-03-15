import type { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'
import { DrawingCanvas, type DrawingCanvasProps } from './DrawingCanvas'

// Wrapper that supplies canvasRef internally so Storybook args don't need it
type CanvasWrapperProps = Omit<DrawingCanvasProps, 'canvasRef'>

function CanvasWrapper(props: CanvasWrapperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  return <DrawingCanvas {...props} canvasRef={canvasRef} />
}

const meta = {
  component: CanvasWrapper,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="relative w-[600px] h-[400px] border border-[#E8E2D9] rounded bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CanvasWrapper>

export default meta
type Story = StoryObj<typeof meta>

export const ActiveDraw: Story = {
  args: {
    active: true,
    brushColor: '#2C2825',
    brushSize: 2,
    erasing: false,
    onChange: (dataUrl) => console.log('drawing changed, length:', dataUrl.length),
  },
}

export const Inactive: Story = {
  args: {
    active: false,
    brushColor: '#7C9E8A',
    brushSize: 4,
    erasing: false,
    onChange: () => {},
  },
}

export const EraserMode: Story = {
  args: {
    active: true,
    brushColor: '#C4614E',
    brushSize: 8,
    erasing: true,
    onChange: () => {},
  },
}
