export interface Legend3DItem {
  color: string
  label: string
  shape: 'bar' | 'stirrup' | 'u' | 'fourCutStirrup'
}

/** A "P"-shaped hook bar: a straight stem with a single uniformly-rounded loop at the top, left
 *  open at the bottom instead of closing back onto the stem. */
function BarIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        d="M9 19 V6 A5 5 0 1 1 15 11"
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
      <rect x="4.5" y="7" width="15" height="10" rx="2.5" fill="none" stroke={color} strokeWidth={2.5} />
    </svg>
  )
}

function UBarIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" style={{ transform: 'rotate(90deg)' }}>
      <path
        d="M7 4 V10 A4 4 0 0 0 11 14 H13 A4 4 0 0 0 17 10 V4"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A four-legged ("czterocięte") stirrup: the normal outer loop with a second, narrower loop nested
 *  inside, rotated 90° from the plain stirrup icon so the two are easy to tell apart at a glance. */
function FourCutStirrupIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" style={{ transform: 'rotate(90deg)' }}>
      <rect x="4.5" y="7" width="15" height="10" rx="2.5" fill="none" stroke={color} strokeWidth={2.5} />
      <rect x="4.5" y="9.75" width="15" height="4.5" rx="1.25" fill="none" stroke={color} strokeWidth={1.75} />
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
          {item.shape === 'bar' ? (
            <BarIcon color={item.color} />
          ) : item.shape === 'u' ? (
            <UBarIcon color={item.color} />
          ) : item.shape === 'fourCutStirrup' ? (
            <FourCutStirrupIcon color={item.color} />
          ) : (
            <StirrupIcon color={item.color} />
          )}
        </div>
      ))}
    </div>
  )
}

export default Legend3D
