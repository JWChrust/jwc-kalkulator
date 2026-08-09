import { getFck, getFyk } from './materials'
import { barArea } from '../../components/RebarSelector'

export const ALPHA_CC = 0.85
export const GAMMA_C = 1.4
export const GAMMA_S = 1.15

export interface CorbelGeometryInputs {
  fVSd: number
  aF: number
  aH: number
  hDim: number
  bDim: number
  concreteClass: string
  steelGrade: string
  rebar11Count: number
  rebar11Diameter: number
  rebar12Diameter: number
}

export interface CorbelCalcResult {
  hSd: number
  d: number
  fck: number
  fyk: number
  nu: number
  fcd: number
  fyd: number
  aFh: number
  coefficient: number
  fVRd: number
  a1: number
  aDist: number
  a2: number
  z: number
  as1: number
  asMin: number
  asReq: number
  as11Area: number
  as12RequiredArea: number
  rebar12SingleArea: number
  rebar12Count: number
  as12Area: number
  asProvided: number
  fywd: number
  aswH: number
}

export function computeCorbelResult({
  fVSd,
  aF,
  aH,
  hDim,
  bDim,
  concreteClass,
  steelGrade,
  rebar11Count,
  rebar11Diameter,
  rebar12Diameter,
}: CorbelGeometryInputs): CorbelCalcResult {
  const hSd = Math.max(10, 0.2 * fVSd)
  const d = hDim - aH
  const fck = getFck(concreteClass)
  const fyk = getFyk(steelGrade)
  const nu = 0.6 * (1 - fck / 250)
  const fcd = fck / GAMMA_C
  const fyd = fyk / GAMMA_S

  const aFh = hDim !== 0 ? aF / hDim : 0
  const coefficient = aFh <= 0.3 ? 0.4 : 0.5
  const fVRd = (coefficient * nu * fcd * ALPHA_CC * bDim * d) / 1000

  const a1 = (fVSd * 1000) / (fcd * ALPHA_CC * bDim)
  const aDist = aF + 0.5 * a1
  const a2 = d - Math.sqrt(d * d - 2 * a1 * aDist)
  const z = d - 0.5 * a2

  const as1Case1 = ((0.5 * fVSd + hSd) * 1000) / fyd
  const as1Case2 = ((fVSd * (aDist / z) + hSd * ((aH + z) / z)) * 1000) / fyd
  const as1 = aFh <= 0.3 ? as1Case1 : as1Case2

  const asMin = 0.004 * bDim * d
  const asReq = Math.max(as1, asMin)

  const as11Area = Math.round(rebar11Count * barArea(rebar11Diameter))
  const as12RequiredArea = Math.max(0, asReq - as11Area)
  const rebar12SingleArea = barArea(rebar12Diameter)
  const rebar12Count = rebar12SingleArea > 0 ? Math.ceil(as12RequiredArea / rebar12SingleArea) : 0
  const as12Area = Math.round(rebar12Count * rebar12SingleArea)
  const asProvided = as11Area + as12Area

  // No separate stirrup steel grade input exists, so f_ywd is assumed equal to f_yd.
  const fywd = fyd
  const aswHCase1 = (0.5 * fVSd * 1000) / fywd
  const aswHCase2 = 0.5 * (as11Area + as12Area)
  const aswHCase3 = 0.3 * (as11Area + as12Area)
  const aswH = aFh <= 0.3 ? aswHCase1 : aFh <= 0.6 ? aswHCase2 : aswHCase3

  return {
    hSd,
    d,
    fck,
    fyk,
    nu,
    fcd,
    fyd,
    aFh,
    coefficient,
    fVRd,
    a1,
    aDist,
    a2,
    z,
    as1,
    asMin,
    asReq,
    as11Area,
    as12RequiredArea,
    rebar12SingleArea,
    rebar12Count,
    as12Area,
    asProvided,
    fywd,
    aswH,
  }
}
