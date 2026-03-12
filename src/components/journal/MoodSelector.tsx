import type { Mood } from '@/types/journal'

export interface MoodSelectorProps {
  value: Mood | null
  onChange: (mood: Mood | null) => void
}

const moods: { value: Mood; label: string; emoji: string }[] = [
  { value: 'calm',     label: 'Calm',     emoji: '🌿' },
  { value: 'happy',   label: 'Happy',    emoji: '☀️' },
  { value: 'grateful',label: 'Grateful', emoji: '🌸' },
  { value: 'anxious', label: 'Anxious',  emoji: '🌊' },
  { value: 'sad',     label: 'Sad',      emoji: '🌧️' },
]

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="How are you feeling?">
      {moods.map((mood) => {
        const selected = value === mood.value
        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(selected ? null : mood.value)}
            aria-label={mood.label}
            aria-pressed={selected}
            title={mood.label}
            className={[
              'w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A]',
              selected
                ? 'bg-[#EAF1EC] scale-110'
                : 'opacity-40 hover:opacity-80 hover:bg-[#F2EEE8]',
            ].join(' ')}
          >
            <span role="img" aria-hidden="true">{mood.emoji}</span>
          </button>
        )
      })}
    </div>
  )
}
