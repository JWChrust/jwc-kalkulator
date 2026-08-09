import { useState } from 'react'
import RebarSelectorFrame from './RebarSelectorFrame'

const DIAMETERS = [6, 8, 10, 12, 14, 16, 20, 25, 32]
const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8]

export interface RebarValue {
  count: number
  diameter: number
}

interface RebarSelectorProps {
  label: string
  /** LaTeX name for the provided-area readout, e.g. "A_{s11}". */
  resultVariable: string
  /** Required area [mm²] — table cells are colored green when they meet it, dark red otherwise.
   *  Omit to skip the comparison entirely (default color everywhere). */
  requiredArea?: number
  /** Tailwind background class for the identifying dot, e.g. "bg-[purple]". */
  dotColorClass: string
  value: RebarValue
  onChange: (value: RebarValue) => void
}

export function barArea(diameter: number): number {
  return Math.PI * (diameter / 2) ** 2
}

/** Manual picker: user chooses both bar count and diameter from a full grid. */
function RebarSelector({
  label,
  resultVariable,
  requiredArea,
  dotColorClass,
  value,
  onChange,
}: RebarSelectorProps) {
  const [open, setOpen] = useState(false)
  const providedArea = Math.round(value.count * barArea(value.diameter))
  const sufficient = requiredArea === undefined ? undefined : providedArea >= requiredArea

  return (
    <RebarSelectorFrame
      label={label}
      dotColorClass={dotColorClass}
      resultVariable={resultVariable}
      providedArea={providedArea}
      widthClass="w-[27rem]"
    >
      <div className="relative w-16 shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-base font-bold hover:border-indigo-500 focus:border-indigo-500 focus:outline-none ${
            sufficient === undefined ? 'text-slate-900' : sufficient ? 'text-green-600' : 'text-red-900'
          }`}
        >
          {value.count}⌀{value.diameter}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 overflow-auto rounded-md border border-slate-300 bg-white p-2 shadow-lg">
              <table className="border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1" />
                    {DIAMETERS.map((d) => (
                      <th key={d} className="px-2 py-1 font-semibold text-slate-700">
                        ⌀{d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTS.map((c) => (
                    <tr key={c}>
                      <th className="px-2 py-1 text-right font-semibold text-slate-700">{c}</th>
                      {DIAMETERS.map((d) => {
                        const area = Math.round(c * barArea(d))
                        const cellSufficient =
                          requiredArea === undefined ? undefined : area >= requiredArea
                        const isSelected = c === value.count && d === value.diameter
                        return (
                          <td key={d}>
                            <button
                              type="button"
                              onClick={() => {
                                onChange({ count: c, diameter: d })
                                setOpen(false)
                              }}
                              className={`w-full rounded px-2 py-1 text-right tabular-nums ${
                                cellSufficient === undefined
                                  ? 'text-slate-900'
                                  : cellSufficient
                                    ? 'text-green-600'
                                    : 'text-red-900'
                              } ${isSelected ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}
                            >
                              {area}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </RebarSelectorFrame>
  )
}

export default RebarSelector
