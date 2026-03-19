import type { Meta, StoryObj } from '@storybook/react'
import { EemoWidget } from './EemoWidget'

const meta: Meta<typeof EemoWidget> = {
  title: 'Journal/EemoWidget',
  component: EemoWidget,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 300, height: 200, background: '#FAF8F5', border: '1px solid #EAE4DC', borderRadius: 4 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof EemoWidget>

export const Hidden: Story = {
  args: {
    emotion: null,
    message: null,
    isLoading: false,
  },
}

export const Happy: Story = {
  args: {
    emotion: 'happy',
    message: null,
    isLoading: false,
  },
}

export const Sad: Story = {
  args: {
    emotion: 'sad',
    message: null,
    isLoading: false,
  },
}

export const Anxious: Story = {
  args: {
    emotion: 'anxious',
    message: null,
    isLoading: false,
  },
}

export const Calm: Story = {
  args: {
    emotion: 'calm',
    message: null,
    isLoading: false,
  },
}

export const Excited: Story = {
  args: {
    emotion: 'excited',
    message: null,
    isLoading: false,
  },
}

export const Nervous: Story = {
  args: {
    emotion: 'nervous',
    message: null,
    isLoading: false,
  },
}

export const Proud: Story = {
  args: {
    emotion: 'proud',
    message: null,
    isLoading: false,
  },
}

export const DistressWithMessage: Story = {
  args: {
    emotion: 'sad',
    message: "I'm here with you.",
    isLoading: false,
  },
}

export const BreakthroughWithMessage: Story = {
  args: {
    emotion: 'proud',
    message: "That took real courage.",
    isLoading: false,
  },
}

export const LoadingWithExistingEmotion: Story = {
  args: {
    emotion: 'calm',
    message: null,
    isLoading: true,
  },
}

export const Love: Story = {
  args: {
    emotion: 'love',
    message: null,
    isLoading: false,
  },
}

export const Confused: Story = {
  args: {
    emotion: 'confused',
    message: null,
    isLoading: false,
  },
}
