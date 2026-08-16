import type { ReactNode } from 'react'
import { useBeamDappedEnd } from './BeamDappedEndContext'
import { roundTo1 } from '../short-corbel/format'
import { CONCRETE_CLASSES, STEEL_GRADES } from '../short-corbel/materials'
import { isTooLarge } from '../short-corbel/validation'
import PresetSelector from '../../components/PresetSelector'
import beamCorbelsImg from '../assets/beam-corbels-1.png'

interface BeamDappedEndPresetValues {
  concreteClass: string
  steelGrade: string
  vEd: string
  aV: string
  aK: string
  hDim: string
  hK: string
  bDim: string
  lK: string
}

const BEAM_DAPPED_END_PRESETS: { label: string; values: BeamDappedEndPresetValues }[] = []

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
    onChange(raw.replace(/[^0-9]/g, ''))
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
        className={`shrink-0 whitespace-nowrap text-right text-[14px] text-slate-700 ${labelClassName}`}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`w-14 shrink-0 rounded-md border bg-[lemonchiffon] px-2 py-1 text-right text-[14px] text-slate-900 focus:outline-none ${
          error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
        }`}
      />
      <span className="text-[14px] text-slate-600">{unit}</span>
    </div>
  )
}

function BeamDappedEndInputs() {
  const {
    concreteClass,
    setConcreteClass,
    steelGrade,
    setSteelGrade,
    vEd,
    setVEd,
    aV,
    setAV,
    aK,
    setAK,
    hDim,
    setHDim,
    hK,
    setHK,
    bDim,
    setBDim,
    lK,
    setLK,
  } = useBeamDappedEnd()

  const anyTooLarge =
    isTooLarge(aV) || isTooLarge(aK) || isTooLarge(hDim) || isTooLarge(hK) || isTooLarge(bDim) || isTooLarge(lK)

  const applyPreset = (values: BeamDappedEndPresetValues) => {
    setConcreteClass(values.concreteClass)
    setSteelGrade(values.steelGrade)
    setVEd(values.vEd)
    setAV(values.aV)
    setAK(values.aK)
    setHDim(values.hDim)
    setHK(values.hK)
    setBDim(values.bDim)
    setLK(values.lK)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[14px] font-semibold text-slate-900">Zbrojenie podcięcia w belce</h2>

      <PresetSelector presets={BEAM_DAPPED_END_PRESETS} onSelect={applyPreset} />

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
        id="v-ed"
        label={
          <>
            V<sub>Ed</sub>
          </>
        }
        unit="[kN]"
        value={vEd}
        onChange={setVEd}
        allowNegative={false}
      />

      <fieldset className="flex flex-col gap-3 rounded-md border border-slate-300 p-3">
        <legend className="px-1 text-[14px] font-medium text-slate-700">Geometria</legend>
        <div className="flex gap-6">
          <div className="flex flex-col gap-3">
            <NumericField
              id="a-v"
              label={
                <>
                  a<sub>v</sub>
                </>
              }
              labelClassName="w-7"
              unit="[mm]"
              value={aV}
              onChange={setAV}
              allowNegative={false}
              error={isTooLarge(aV)}
            />
            <NumericField
              id="a-k"
              label={
                <>
                  a<sub>k</sub>
                </>
              }
              labelClassName="w-7"
              unit="[mm]"
              value={aK}
              onChange={setAK}
              allowNegative={false}
              error={isTooLarge(aK)}
            />
            <NumericField
              id="b-dim"
              label="b"
              labelClassName="w-7"
              unit="[mm]"
              value={bDim}
              onChange={setBDim}
              allowNegative={false}
              error={isTooLarge(bDim)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <NumericField
              id="h-dim"
              label="h"
              labelClassName="w-7"
              unit="[mm]"
              value={hDim}
              onChange={setHDim}
              allowNegative={false}
              error={isTooLarge(hDim)}
            />
            <NumericField
              id="h-k"
              label={
                <>
                  h<sub>k</sub>
                </>
              }
              labelClassName="w-7"
              unit="[mm]"
              value={hK}
              onChange={setHK}
              allowNegative={false}
              error={isTooLarge(hK)}
            />
            <NumericField
              id="l-k"
              label={
                <>
                  l<sub>k</sub>
                </>
              }
              labelClassName="w-7"
              unit="[mm]"
              value={lK}
              onChange={setLK}
              allowNegative={false}
              error={isTooLarge(lK)}
            />
          </div>
        </div>
      </fieldset>

      {anyTooLarge && (
        <p className="text-[14px] text-red-600">Wymiary geometrii nie mogą przekraczać 1000mm</p>
      )}

      <img
        src={beamCorbelsImg}
        alt="Schemat podcięcia w belce"
        width={440}
        height={170}
        className="h-auto w-full max-w-[440px] object-contain"
      />
    </div>
  )
}

export default BeamDappedEndInputs
