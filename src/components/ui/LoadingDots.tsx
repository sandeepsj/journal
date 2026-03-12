export interface LoadingDotsProps {
  size?: 'sm' | 'md'
}

const sizeMap = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
}

export function LoadingDots({ size = 'md' }: LoadingDotsProps) {
  const dot = sizeMap[size]

  return (
    <span role="status" aria-label="Loading" className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${dot} rounded-full bg-current opacity-60`}
          style={{
            animation: 'loadingBounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes loadingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          span[style] { animation: none; opacity: 0.6; }
        }
      `}</style>
    </span>
  )
}
