import { useEffect, useState } from 'react'
import RebarSelectorFrame from './RebarSelectorFrame'
import { barArea } from './RebarSelector'

const DIAMETERS = [6, 8, 10, 12, 14, 16, 20, 25, 32]
const PHASE_DOTS = ['●', '●●', '●●●●']
/** Cut-count multiplier for each toggle phase — the derived count is rounded up to a multiple of this. */
const PHASE_MULTIPLIERS = [1, 2, 4]

export interface SelektorV3Value {
  count: number
  diameter: number
}

interface SelektorV3Props {
  label: string
  /** LaTeX name for the provided-area readout, e.g. "A_{s12}". */
  resultVariable: string
  /** Required area [mm²] — the bar count is derived from this (rounded up to the toggle's multiple). */
  requiredArea: number
  /** Tailwind background class for the identifying dot, e.g. "bg-[darkorange]". */
  dotColorClass: string
  value: SelektorV3Value
  onChange: (value: SelektorV3Value) => void
  /** Initial x1/x2/x4 toggle phase (index into the toggle buttons). Defaults to 0 (x1). */
  initialPhase?: number
  /** Toggle phase indices to disable for this instance (e.g. [0] to forbid x1 when bars must pair up). */
  disabledPhases?: number[]
}

/** Auto picker: user chooses only the diameter (plus an x1/x2/x4 toggle); the bar count is derived
 *  from requiredArea, rounded up to a multiple of the toggle's phase. */
function SelektorV3({
  label,
  resultVariable,
  requiredArea,
  dotColorClass,
  value,
  onChange,
  initialPhase = 0,
  disabledPhases = [],
}: SelektorV3Props) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState(initialPhase)
  const multiplier = PHASE_MULTIPLIERS[phase]

  const singleArea = barArea(value.diameter)
  const rawCount = singleArea > 0 ? Math.ceil(requiredArea / singleArea) : 0
  const derivedCount = multiplier * Math.ceil(rawCount / multiplier)
  const providedArea = Math.round(derivedCount * singleArea)

  useEffect(() => {
    if (derivedCount !== value.count) {
      onChange({ count: derivedCount, diameter: value.diameter })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedCount])

  return (
    <RebarSelectorFrame
      label={label}
      dotColorClass={dotColorClass}
      resultVariable={resultVariable}
      providedArea={providedArea}
      widthClass="w-fit"
      after={
        <div className="-ml-[9px] flex shrink-0">
          {PHASE_DOTS.map((dots, i) => {
            const phaseDisabled = disabledPhases.includes(i)
            return (
              <button
                key={i}
                type="button"
                disabled={phaseDisabled}
                onClick={() => setPhase(i)}
                className={`border bg-[lemonchiffon] px-2 py-1 text-[14px] font-bold leading-none focus:outline-none ${
                  i > 0 ? '-ml-px' : ''
                } ${i === 0 ? 'rounded-l-md' : ''} ${i === PHASE_DOTS.length - 1 ? 'rounded-r-md' : ''} ${
                  phaseDisabled
                    ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-300'
                    : phase === i
                      ? 'relative z-10 border-indigo-500 text-slate-900'
                      : 'border-slate-300 text-slate-400 hover:border-indigo-400'
                }`}
              >
                {dots}
              </button>
            )
          })}
        </div>
      }
    >
      <div className="flex w-20 shrink-0 items-center gap-1">
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full rounded-md border border-slate-300 bg-[lemonchiffon] px-1 py-1 text-center text-[14px] font-bold text-slate-900 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
          >
            ⌀{value.diameter}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 overflow-auto rounded-md border border-slate-300 bg-white p-2 shadow-lg">
                <table className="border-collapse text-[14px]">
                  <tbody>
                    <tr>
                      {DIAMETERS.map((d) => {
                        const isSelected = d === value.diameter
                        return (
                          <td key={d}>
                            <button
                              type="button"
                              onClick={() => {
                                onChange({ count: derivedCount, diameter: d })
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

        <span className="shrink-0 text-[14px] font-bold text-slate-900">x{derivedCount}</span>
      </div>
    </RebarSelectorFrame>
  )
}

export default SelektorV3
