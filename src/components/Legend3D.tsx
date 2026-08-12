export interface Legend3DItem {
  color: string
  label: string
  shape: 'bar' | 'stirrup'
}

function BarIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        d="M9 19 V5 H16 A4 4 0 0 1 16 13 H9"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StirrupIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke={color} strokeWidth={2.5} />
    </svg>
  )
}

interface Legend3DProps {
  items: Legend3DItem[]
}

function Legend3D({ items }: Legend3DProps) {
  if (items.length === 0) return null

  return (
    <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1.5 rounded-md border border-slate-300 bg-white/90 px-2 py-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="w-12 shrink-0 text-[14px] text-slate-700">{item.label}</span>
          {item.shape === 'bar' ? <BarIcon color={item.color} /> : <StirrupIcon color={item.color} />}
        </div>
      ))}
    </div>
  )
}

export default Legend3D
