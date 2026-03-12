import { Button } from '@/components/ui/Button'

export interface EmptyStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  title = 'Your story starts here',
  description = 'Write your first entry and begin building your personal memory.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      {/* Illustration */}
      <div className="mb-6 text-6xl select-none" aria-hidden="true">
        📓
      </div>

      <h2 className="font-serif text-2xl text-[#2C2825] mb-2">{title}</h2>
      <p className="text-sm text-[#8B7D72] max-w-xs leading-relaxed mb-6">{description}</p>

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
