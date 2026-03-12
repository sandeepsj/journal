export interface DividerProps {
  label?: string
}

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-[#E8E2D9]" />
        <span className="text-xs text-[#B5A99F]">{label}</span>
        <div className="flex-1 border-t border-[#E8E2D9]" />
      </div>
    )
  }

  return <hr className="border-t border-[#E8E2D9]" />
}
