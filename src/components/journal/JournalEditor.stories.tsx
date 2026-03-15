import type { Meta, StoryObj } from '@storybook/react'
import { JournalEditor } from './JournalEditor'

const meta = {
  component: JournalEditor,
  tags: ['autodocs'],
  parameters: {
    // Full viewport — this is a full-page component
    layout: 'fullscreen',
  },
} satisfies Meta<typeof JournalEditor>

export default meta
type Story = StoryObj<typeof meta>

export const NewEntry: Story = {}

export const ExistingEntry: Story = {
  args: {
    entryId: 'existing-123',
    initialTitle: 'A quiet morning by the window',
    initialBody:
      'I woke up before the alarm today. The light was soft and amber and I sat with my coffee for a long time just watching the birds move through the garden. There was no urgency, no rushing — just the sound of the house settling and the warmth of the mug in my hands.\n\nI have been thinking a lot about slowness lately. How we fill every gap with noise. How the quiet moments are the ones that actually shape us.',
    initialMood: 'calm',
    initialTextColor: '#2C2825',
  },
}

export const ColoredInk: Story = {
  args: {
    entryId: 'colored-456',
    initialTitle: 'Writing in green today',
    initialBody: 'Sometimes changing the ink color feels like changing your perspective.',
    initialMood: 'happy',
    initialTextColor: '#7C9E8A',
  },
}

export const LongBody: Story = {
  args: {
    initialTitle: 'Reflections on the year so far',
    initialBody: Array(10)
      .fill(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.'
      )
      .join('\n\n'),
  },
}
