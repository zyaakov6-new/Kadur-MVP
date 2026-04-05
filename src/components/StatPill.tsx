interface StatPillProps {
  label: string
  value: number | string
  accent?: boolean
}

export default function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div className="glass-card flex flex-col items-center py-3 px-4 gap-0.5">
      <span
        className="font-display text-2xl leading-none"
        style={{ color: accent ? '#FF5A1F' : '#52b48d' }}
      >
        {value}
      </span>
      <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
    </div>
  )
}
