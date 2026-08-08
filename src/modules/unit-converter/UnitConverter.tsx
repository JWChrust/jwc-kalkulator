import { useMemo, useState } from 'react'

const LENGTH_UNITS = {
  m: { label: 'Meters', toMeters: 1 },
  km: { label: 'Kilometers', toMeters: 1000 },
  cm: { label: 'Centimeters', toMeters: 0.01 },
  mm: { label: 'Millimeters', toMeters: 0.001 },
  mi: { label: 'Miles', toMeters: 1609.344 },
  yd: { label: 'Yards', toMeters: 0.9144 },
  ft: { label: 'Feet', toMeters: 0.3048 },
  in: { label: 'Inches', toMeters: 0.0254 },
} as const

type LengthUnit = keyof typeof LENGTH_UNITS

function UnitConverter() {
  const [rawValue, setRawValue] = useState('1')
  const [fromUnit, setFromUnit] = useState<LengthUnit>('m')
  const [toUnit, setToUnit] = useState<LengthUnit>('ft')

  const numericValue = Number(rawValue)
  const isValid = rawValue.trim() !== '' && Number.isFinite(numericValue)

  const result = useMemo(() => {
    if (!isValid) return null
    const meters = numericValue * LENGTH_UNITS[fromUnit].toMeters
    return meters / LENGTH_UNITS[toUnit].toMeters
  }, [isValid, numericValue, fromUnit, toUnit])

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Length Converter
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="value" className="text-sm text-slate-600 dark:text-slate-400">
          Value
        </label>
        <input
          id="value"
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {!isValid && (
          <p className="text-sm text-red-600 dark:text-red-400">Enter a valid number</p>
        )}
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="from" className="text-sm text-slate-600 dark:text-slate-400">
            From
          </label>
          <select
            id="from"
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value as LengthUnit)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {Object.entries(LENGTH_UNITS).map(([key, unit]) => (
              <option key={key} value={key}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="to" className="text-sm text-slate-600 dark:text-slate-400">
            To
          </label>
          <select
            id="to"
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value as LengthUnit)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {Object.entries(LENGTH_UNITS).map(([key, unit]) => (
              <option key={key} value={key}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/50">
        <span className="text-sm text-slate-600 dark:text-slate-400">Result: </span>
        <span className="font-mono text-slate-900 dark:text-slate-100">
          {result === null ? '—' : result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </span>
      </div>
    </div>
  )
}

export default UnitConverter
