import { useEffect, useState } from 'react'
import RebarSelectorFrame from './RebarSelectorFrame'

const DIAMETERS = [6, 8, 10, 12, 14, 16, 20, 25, 32]
const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8]
const PHASE_DOTS = ['●', '●●', '●●●●']

export interface RebarValue {
  count: number
  diameter: number
}

/** Snaps an odd count up to the next even one, or down if that would exceed the available range. */
function snapToEvenCount(count: number): number {
  if (count % 2 === 0) return count
  const up = count + 1
  return up <= COUNTS[COUNTS.length - 1] ? up : count - 1
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
  /** When true, only even bar counts are selectable — odd rows are grayed out and disabled.
   *  Switching this on snaps an odd selected count to the nearest even one. */
  onlyEven?: boolean
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
  onlyEven = false,
}: RebarSelectorProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState(0)
  const providedArea = Math.round(value.count * barArea(value.diameter))
  const sufficient = requiredArea === undefined ? undefined : providedArea >= requiredArea

  useEffect(() => {
    if (onlyEven && value.count % 2 !== 0) {
      onChange({ count: snapToEvenCount(value.count), diameter: value.diameter })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyEven])

  return (
    <RebarSelectorFrame
      label={label}
      dotColorClass={dotColorClass}
      resultVariable={resultVariable}
      providedArea={providedArea}
      widthClass="w-fit"
      after={
        <div className="-ml-[9px] flex shrink-0">
          {PHASE_DOTS.map((dots, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPhase(i)}
              className={`border px-2 py-1 text-[14px] font-bold leading-none focus:outline-none ${
                i > 0 ? '-ml-px' : ''
              } ${i === 0 ? 'rounded-l-md' : ''} ${i === PHASE_DOTS.length - 1 ? 'rounded-r-md' : ''} ${
                phase === i
                  ? 'relative z-10 border-indigo-500 bg-indigo-100 text-slate-900'
                  : 'border-slate-300 text-slate-400 hover:border-indigo-400'
              }`}
            >
              {dots}
            </button>
          ))}
        </div>
      }
    >
      <div className="relative w-28 shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full rounded-md border border-slate-300 bg-[lemonchiffon] px-2 py-1 text-center text-[14px] font-bold hover:border-indigo-500 focus:border-indigo-500 focus:outline-none ${
            sufficient === undefined ? 'text-slate-900' : sufficient ? 'text-green-600' : 'text-red-900'
          }`}
        >
          {value.count === 0 ? '0' : `${value.count}⌀${value.diameter}`}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 overflow-auto rounded-md border border-slate-300 bg-white p-2 shadow-lg">
              <table className="border-collapse text-[14px]">
                <thead>
                  <tr>
                    <th className="border border-slate-300 bg-slate-100 p-0">
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ count: 0, diameter: value.diameter })
                          setOpen(false)
                        }}
                        className="w-full px-2 py-1 font-bold text-red-900 hover:bg-slate-200"
                        title="Brak zbrojenia"
                      >
                        0
                      </button>
                    </th>
                    {DIAMETERS.map((d) => (
                      <th
                        key={d}
                        className="border border-slate-300 bg-slate-100 px-2 py-1 font-semibold text-slate-700"
                      >
                        ⌀{d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTS.map((c) => {
                    const rowDisabled = onlyEven && c % 2 !== 0
                    return (
                    <tr key={c}>
                      <th
                        className={`border border-slate-300 px-2 py-1 text-right font-semibold ${
                          rowDisabled ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c}
                      </th>
                      {DIAMETERS.map((d) => {
                        const area = Math.round(c * barArea(d))
                        const cellSufficient =
                          requiredArea === undefined ? undefined : area >= requiredArea
                        const isSelected = c === value.count && d === value.diameter
                        return (
                          <td key={d} className="border border-slate-300">
                            <button
                              type="button"
                              disabled={rowDisabled}
                              onClick={() => {
                                onChange({ count: c, diameter: d })
                                setOpen(false)
                              }}
                              className={`w-full rounded px-2 py-1 text-right tabular-nums ${
                                rowDisabled
                                  ? 'cursor-not-allowed text-slate-300'
                                  : cellSufficient === undefined
                                    ? 'text-slate-900'
                                    : cellSufficient
                                      ? 'text-green-600'
                                      : 'text-red-900'
                              } ${isSelected ? 'bg-indigo-100' : rowDisabled ? '' : 'hover:bg-slate-100'}`}
                            >
                              {area}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                    )
                  })}
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
