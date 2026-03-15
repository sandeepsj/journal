import type { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'
import { DrawingCanvas } from './DrawingCanvas'

const meta = {
  component: DrawingCanvas,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="relative w-[600px] h-[400px] border border-[#E8E2D9] rounded bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DrawingCanvas>

export default meta
type Story = StoryObj<typeof meta>

// Wrapper that supplies canvasRef
function CanvasWrapper(props: Omit<React.ComponentProps<typeof DrawingCanvas>, 'canvasRef'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  return <DrawingCanvas {...props} canvasRef={canvasRef} />
}

export const ActiveDraw: Story = {
  render: (args) => <CanvasWrapper {...args} />,
  args: {
    active: true,
    brushColor: '#2C2825',
    brushSize: 2,
    erasing: false,
    onChange: (dataUrl) => console.log('drawing changed, length:', dataUrl.length),
  },
}

export const Inactive: Story = {
  render: (args) => <CanvasWrapper {...args} />,
  args: {
    active: false,
    brushColor: '#7C9E8A',
    brushSize: 4,
    erasing: false,
    onChange: () => {},
  },
}

export const EraserMode: Story = {
  render: (args) => <CanvasWrapper {...args} />,
  args: {
    active: true,
    brushColor: '#C4614E',
    brushSize: 8,
    erasing: true,
    onChange: () => {},
  },
}
