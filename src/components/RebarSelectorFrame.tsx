import type { ReactNode } from 'react'
import Formula from './Formula'

interface RebarSelectorFrameProps {
  label: string
  /** Tailwind background class for the identifying dot, e.g. "bg-[purple]". */
  dotColorClass: string
  /** LaTeX name for the provided-area readout, e.g. "A_{s11}". */
  resultVariable: string
  providedArea: number
  /** Fixed width of the row, kept consistent across instances of the same variant. */
  widthClass: string
  /** The diameter/count picker(s) rendered between the label and the result readout. */
  children: ReactNode
}

/** Shared visual shell (dot, label, picker slot, result readout) used by every RebarSelector variant. */
function RebarSelectorFrame({
  label,
  dotColorClass,
  resultVariable,
  providedArea,
  widthClass,
  children,
}: RebarSelectorFrameProps) {
  return (
    <div
      className={`flex ${widthClass} items-center gap-3 rounded-md border-2 border-slate-600 p-2 text-sm`}
    >
      <span className={`h-3 w-3 shrink-0 rounded-full ${dotColorClass}`} />
      <span className="w-32 pr-2 text-slate-700">{label}</span>

      {children}

      <span className="w-44 shrink-0 whitespace-nowrap">
        <Formula tex={String.raw`${resultVariable} = \mathbf{${providedArea}}\ [\text{mm}^2]`} />
      </span>
    </div>
  )
}

export default RebarSelectorFrame
