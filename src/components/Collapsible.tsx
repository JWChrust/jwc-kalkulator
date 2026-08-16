import { useState, type ReactNode } from 'react'
import { usePrintMode } from '../PrintModeContext'

interface CollapsibleProps {
  /** Lowercase noun shown in the toggle button, e.g. "obliczenia" -> "Pokaż obliczenia" / "Ukryj obliczenia". */
  label: string
  /** Shows a warning icon on the toggle button when the content contains a failing check or invalid state. */
  hasWarning?: boolean
  /** Receives `showValues` so equations inside can swap symbols for their substituted numeric values. */
  children: ReactNode | ((showValues: boolean) => ReactNode)
}

function Collapsible({ label, hasWarning = false, children }: CollapsibleProps) {
  const printMode = usePrintMode()
  const [openState, setOpen] = useState(false)
  const [showValues, setShowValues] = useState(false)
  const open = printMode || openState

  return (
    <div className="flex w-full flex-col gap-2">
      {!printMode && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-600 bg-[#E3E1E1] px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
        >
          {hasWarning && (
            <svg
              className="h-4 w-4 shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <title>Zawiera ostrzeżenia</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line strokeLinecap="round" x1="12" y1="9" x2="12" y2="13" />
              <line strokeLinecap="round" x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          {open ? `Ukryj ${label}` : `Pokaż ${label}`}
          <svg
            className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {open && (
        <div className="relative flex w-full flex-col gap-4 overflow-x-auto rounded-md border-2 border-slate-600 p-3">
          {!printMode && (
            <button
              type="button"
              onClick={() => setShowValues((v) => !v)}
              className="absolute right-3 top-3 z-10 shrink-0 rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-[14px] font-medium text-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
            >
              {showValues ? 'Pokaż symbole' : 'Pokaż wartości'}
            </button>
          )}
          {typeof children === 'function' ? children(showValues) : children}
        </div>
      )}
    </div>
  )
}

export default Collapsible
