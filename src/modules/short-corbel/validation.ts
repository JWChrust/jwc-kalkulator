import { getFck } from './materials'
import { ALPHA_CC, GAMMA_C } from './calculations'

const MAX_GEOMETRY_MM = 1000

export function isNonPositive(value: string): boolean {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n <= 0
}

export function isTooLarge(value: string): boolean {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n > MAX_GEOMETRY_MM
}

export interface CorbelInputValues {
  fVSd: string
  aF: string
  aH: string
  hDim: string
  bDim: string
  concreteClass: string
}

/** Lever arm z, per the same geometry used in the main-rebar calculation chain. */
export function computeZ({ fVSd, aF, aH, hDim, bDim, concreteClass }: CorbelInputValues): number {
  const d = Number(hDim) - Number(aH)
  const fcd = getFck(concreteClass) / GAMMA_C
  const a1 = (Number(fVSd) * 1000) / (fcd * ALPHA_CC * Number(bDim))
  const aDist = Number(aF) + 0.5 * a1
  const a2 = d - Math.sqrt(d * d - 2 * a1 * aDist)
  return d - 0.5 * a2
}

/** True when a_F exceeds the lever arm z (the corbel is no longer "short"). */
export function isAfGreaterThanZ(values: CorbelInputValues): boolean {
  const z = computeZ(values)
  return Number.isFinite(z) && Number(values.aF) > z
}

/**
 * True when any input is invalid: non-positive, a geometry dimension over 1000mm, a_H greater
 * than h, a_F/h > 1, or a_F > z (a corbel geometry the formulas can't evaluate).
 */
export function hasCorbelInputError({
  fVSd,
  aF,
  aH,
  hDim,
  bDim,
  concreteClass,
}: CorbelInputValues): boolean {
  const geometryError = Number(aH) > Number(hDim)
  const anyNonPositive =
    isNonPositive(fVSd) ||
    isNonPositive(aF) ||
    isNonPositive(aH) ||
    isNonPositive(bDim) ||
    isNonPositive(hDim)
  const anyTooLarge = isTooLarge(aF) || isTooLarge(aH) || isTooLarge(bDim) || isTooLarge(hDim)
  const hNum = Number(hDim)
  const aFh = hNum !== 0 ? Number(aF) / hNum : 0
  const invalidGeometry = aFh > 1
  const afGreaterThanZ =
    !geometryError && !anyNonPositive && !anyTooLarge && isAfGreaterThanZ({ fVSd, aF, aH, hDim, bDim, concreteClass })

  return geometryError || anyNonPositive || anyTooLarge || invalidGeometry || afGreaterThanZ
}
