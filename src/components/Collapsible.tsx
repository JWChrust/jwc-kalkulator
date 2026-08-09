import { useState, type ReactNode } from 'react'

interface CollapsibleProps {
  /** Lowercase noun shown in the toggle button, e.g. "obliczenia" -> "Pokaż obliczenia" / "Ukryj obliczenia". */
  label: string
  /** Receives `showValues` so equations inside can swap symbols for their substituted numeric values. */
  children: ReactNode | ((showValues: boolean) => ReactNode)
}

function Collapsible({ label, children }: CollapsibleProps) {
  const [open, setOpen] = useState(false)
  const [showValues, setShowValues] = useState(false)

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
      >
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

      {open && (
        <div className="relative flex w-full flex-col gap-4 overflow-x-auto rounded-md border-2 border-slate-600 p-3 pt-10">
          <button
            type="button"
            onClick={() => setShowValues((v) => !v)}
            className="absolute right-3 top-3 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
          >
            {showValues ? 'Pokaż symbole' : 'Pokaż wartości'}
          </button>
          {typeof children === 'function' ? children(showValues) : children}
        </div>
      )}
    </div>
  )
}

export default Collapsible
