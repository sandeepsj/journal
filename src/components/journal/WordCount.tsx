export interface WordCountProps {
  count: number
  max?: number
}

export function WordCount({ count, max }: WordCountProps) {
  const atLimit = max !== undefined && count >= max

  return (
    <p
      className={`text-xs tabular-nums transition-colors duration-150 ${
        atLimit ? 'text-[#C4614E]' : 'text-[#B5A99F]'
      }`}
      aria-live="polite"
      aria-label={`${count} word${count !== 1 ? 's' : ''}${max ? ` of ${max} maximum` : ''}`}
    >
      {count.toLocaleString()} {max ? `/ ${max.toLocaleString()}` : ''} {count === 1 ? 'word' : 'words'}
    </p>
  )
}
