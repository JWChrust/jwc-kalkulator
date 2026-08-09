import { useState } from 'react'
import RebarSelectorFrame from './RebarSelectorFrame'
import { barArea } from './RebarSelector'

const DIAMETERS = [6, 8, 10, 12, 14, 16, 20, 25, 32]

export interface RebarAutoValue {
  diameter: number
}

interface RebarSelectorAutoProps {
  label: string
  /** LaTeX name for the provided-area readout, e.g. "A_{s12}". */
  resultVariable: string
  /** Required area [mm²] — the bar count is derived from this, so it's mandatory here. */
  requiredArea: number
  /** Tailwind background class for the identifying dot, e.g. "bg-[darkorange]". */
  dotColorClass: string
  value: RebarAutoValue
  onChange: (value: RebarAutoValue) => void
}

/** Auto picker: user chooses only the diameter, the bar count is derived from requiredArea. */
function RebarSelectorAuto({
  label,
  resultVariable,
  requiredArea,
  dotColorClass,
  value,
  onChange,
}: RebarSelectorAutoProps) {
  const [open, setOpen] = useState(false)
  const singleArea = barArea(value.diameter)
  const count = singleArea > 0 ? Math.ceil(requiredArea / singleArea) : 0
  const providedArea = Math.round(count * singleArea)

  return (
    <RebarSelectorFrame
      label={label}
      dotColorClass={dotColorClass}
      resultVariable={resultVariable}
      providedArea={providedArea}
      widthClass="w-[27rem]"
    >
      <div className="flex w-16 shrink-0 items-center gap-1">
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full rounded-md border border-slate-300 bg-white px-1 py-1 text-center text-base font-bold text-slate-900 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
          >
            ⌀{value.diameter}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 overflow-auto rounded-md border border-slate-300 bg-white p-2 shadow-lg">
                <table className="border-collapse text-xs">
                  <tbody>
                    <tr>
                      {DIAMETERS.map((d) => {
                        const isSelected = d === value.diameter
                        return (
                          <td key={d}>
                            <button
                              type="button"
                              onClick={() => {
                                onChange({ diameter: d })
                                setOpen(false)
                              }}
                              className={`w-full rounded px-2 py-1 text-center tabular-nums text-slate-900 ${
                                isSelected ? 'bg-indigo-100' : 'hover:bg-slate-100'
                              }`}
                            >
                              ⌀{d}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <span className="shrink-0 text-base font-bold text-slate-900">x{count}</span>
      </div>
    </RebarSelectorFrame>
  )
}

export default RebarSelectorAuto
