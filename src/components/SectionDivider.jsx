export default function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-4 first:mt-0">
      <span
        className="text-[11px] font-medium tracking-wide uppercase shrink-0"
        style={{ color: 'var(--color-muted)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  )
}
