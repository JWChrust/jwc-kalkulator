import type { ReactNode } from 'react'
import { useCorbel } from './CorbelContext'
import { roundTo1 } from './format'
import { CONCRETE_CLASSES, STEEL_GRADES } from './materials'
import { isAfGreaterThanZ, isNonPositive, isTooLarge } from './validation'
import PresetSelector from '../../components/PresetSelector'
import corbelDiagram from '../assets/corbel1-rem.png'

interface CorbelPresetValues {
  concreteClass: string
  steelGrade: string
  fVSd: string
  aF: string
  aH: string
  hDim: string
  bDim: string
}

const CORBEL_PRESETS: { label: string; values: CorbelPresetValues }[] = []

interface NumericFieldProps {
  id: string
  label: ReactNode
  unit: string
  value: string
  onChange: (value: string) => void
  labelClassName?: string
  allowNegative?: boolean
  error?: boolean
}

function NumericField({
  id,
  label,
  unit,
  value,
  onChange,
  labelClassName = '',
  allowNegative = true,
  error = false,
}: NumericFieldProps) {
  const handleChange = (raw: string) => {
    onChange(allowNegative ? raw : raw.replace(/-/g, ''))
  }

  const handleBlur = () => {
    const n = Number(value)
    if (value.trim() !== '' && Number.isFinite(n)) {
      const rounded = roundTo1(n)
      onChange(String(allowNegative ? rounded : Math.max(0, rounded)))
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className={`shrink-0 whitespace-nowrap text-[14px] text-slate-700 ${labelClassName}`}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`w-16 shrink-0 rounded-md border bg-[lemonchiffon] px-2 py-1 text-right text-slate-900 focus:outline-none ${
          error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
        }`}
      />
      <span className="text-[14px] text-slate-600">{unit}</span>
    </div>
  )
}

function CorbelInputs() {
  const {
    concreteClass,
    setConcreteClass,
    steelGrade,
    setSteelGrade,
    fVSd,
    setFVSd,
    aF,
    setAF,
    aH,
    setAH,
    hDim,
    setHDim,
    bDim,
    setBDim,
  } = useCorbel()

  const geometryError = Number(aH) > Number(hDim)
  const fVSdInvalid = isNonPositive(fVSd)
  const aFInvalid = isNonPositive(aF) || isTooLarge(aF)
  const aHInvalid = isNonPositive(aH) || isTooLarge(aH)
  const bInvalid = isNonPositive(bDim) || isTooLarge(bDim)
  const hInvalid = isNonPositive(hDim) || isTooLarge(hDim)
  const anyNonPositive = fVSdInvalid || isNonPositive(aF) || isNonPositive(aH) || isNonPositive(bDim) || isNonPositive(hDim)
  const anyTooLarge = isTooLarge(aF) || isTooLarge(aH) || isTooLarge(bDim) || isTooLarge(hDim)
  const afGreaterThanZError =
    !geometryError &&
    !anyNonPositive &&
    !anyTooLarge &&
    isAfGreaterThanZ({ fVSd, aF, aH, hDim, bDim, concreteClass })

  const applyPreset = (values: CorbelPresetValues) => {
    setConcreteClass(values.concreteClass)
    setSteelGrade(values.steelGrade)
    setFVSd(values.fVSd)
    setAF(values.aF)
    setAH(values.aH)
    setHDim(values.hDim)
    setBDim(values.bDim)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[14px] font-semibold text-slate-900">Zbrojenie wsporników krótkich</h2>

      <PresetSelector presets={CORBEL_PRESETS} onSelect={applyPreset} />

      <fieldset className="flex flex-col gap-3 rounded-md border border-slate-300 p-3">
        <legend className="px-1 text-[14px] font-medium text-slate-700">Materiały</legend>

        <div className="flex flex-col gap-1">
          <label htmlFor="concrete-class" className="text-[14px] text-slate-700">
            Klasa betonu
          </label>
          <select
            id="concrete-class"
            value={concreteClass}
            onChange={(e) => setConcreteClass(e.target.value)}
            className="w-40 rounded-md border border-slate-300 bg-[lemonchiffon] px-2 py-1 text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            {CONCRETE_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="steel-grade" className="text-[14px] text-slate-700">
            Gatunek stali
          </label>
          <select
            id="steel-grade"
            value={steelGrade}
            onChange={(e) => setSteelGrade(e.target.value)}
            className="w-40 rounded-md border border-slate-300 bg-[lemonchiffon] px-2 py-1 text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            {STEEL_GRADES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <NumericField
        id="f-v-sd"
        label={
          <>
            V<sub>Ed</sub>
          </>
        }
        unit="[kN]"
        value={fVSd}
        onChange={setFVSd}
        allowNegative={false}
        error={fVSdInvalid}
      />

      <fieldset className="flex flex-col gap-3 rounded-md border border-slate-300 p-3">
        <legend className="px-1 text-[14px] font-medium text-slate-700">Geometria</legend>
        <div className="flex gap-6">
          <div className="flex flex-col gap-3">
            <NumericField
              id="a-f"
              label={
                <>
                  a<sub>F</sub>
                </>
              }
              labelClassName="w-7"
              unit="[mm]"
              value={aF}
              onChange={setAF}
              allowNegative={false}
              error={aFInvalid || afGreaterThanZError}
            />
            <NumericField
              id="a-h"
              label={
                <>
                  a<sub>H</sub>
                </>
              }
              labelClassName="w-7"
              unit="[mm]"
              value={aH}
              onChange={setAH}
              allowNegative={false}
              error={geometryError || aHInvalid}
            />
          </div>
          <div className="flex flex-col gap-3">
            <NumericField
              id="b-dim"
              label="b"
              labelClassName="w-7"
              unit="[mm]"
              value={bDim}
              onChange={setBDim}
              allowNegative={false}
              error={bInvalid}
            />
            <NumericField
              id="h-dim"
              label="h"
              labelClassName="w-7"
              unit="[mm]"
              value={hDim}
              onChange={setHDim}
              allowNegative={false}
              error={geometryError || hInvalid}
            />
          </div>
        </div>
        {geometryError && (
          <p className="text-[14px] text-red-600">
            a<sub>H</sub> nie może być większe niż h
          </p>
        )}
        {afGreaterThanZError && (
          <p className="text-[14px] text-red-600">
            a<sub>F</sub> nie może być większe niż z (wspornik nie jest krótki)
          </p>
        )}
      </fieldset>

      {anyNonPositive && (
        <p className="text-[14px] text-red-600">Wszystkie wartości muszą być większe od 0</p>
      )}
      {anyTooLarge && (
        <p className="text-[14px] text-red-600">Wymiary geometrii nie mogą przekraczać 1000mm</p>
      )}

      <img
        src={corbelDiagram}
        alt="Schemat geometrii wspornika krótkiego"
        width={440}
        height={399}
        className="h-auto w-full max-w-[440px] object-contain"
      />
    </div>
  )
}

export default CorbelInputs
