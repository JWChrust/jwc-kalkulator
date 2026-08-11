export interface Preset<T> {
  label: string
  values: T
}

interface PresetSelectorProps<T> {
  presets: Preset<T>[]
  onSelect: (values: T) => void
}

/** Combobox of predefined input presets for a module — selecting one fills the inputs via onSelect. */
function PresetSelector<T>({ presets, onSelect }: PresetSelectorProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="preset-select" className="text-[14px] text-slate-700">
        Preset
      </label>
      <select
        id="preset-select"
        defaultValue=""
        disabled={presets.length === 0}
        onChange={(e) => {
          const preset = presets.find((p) => p.label === e.target.value)
          if (preset) onSelect(preset.values)
        }}
        className="w-40 rounded-md border border-slate-300 bg-[lemonchiffon] px-2 py-1 text-slate-900 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>
          {presets.length === 0 ? 'Brak presetów' : 'Wybierz preset'}
        </option>
        {presets.map((p) => (
          <option key={p.label} value={p.label}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default PresetSelector
