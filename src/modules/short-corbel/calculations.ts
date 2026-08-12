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
  rebarSwDiameter: number
  rebar31Diameter: number
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
  rebarSwSingleArea: number
  rebarSwCount: number
  aswHArea: number
  beta: number
  kFactor: number
  rhoL: number
  vRdc: number
  linkCase1: boolean
  linkCase2: boolean
  linkCase3: boolean
  asLink: number
  rebar31SingleArea: number
  rebar31Count: number
  asLinkArea: number
}

/** Stirrup legs come in pairs (2-cięte, 4-cięte, ...): round the raw bar count up to the nearest even number. */
function legsForArea(requiredArea: number, diameter: number): number {
  const area = barArea(diameter)
  const rawCount = area > 0 ? Math.ceil(requiredArea / area) : 0
  return 2 * Math.ceil(rawCount / 2)
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
  rebarSwDiameter,
  rebar31Diameter,
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
  const rebar12Count = legsForArea(as12RequiredArea, rebar12Diameter)
  const as12Area = Math.round(rebar12Count * rebar12SingleArea)
  const asProvided = as11Area + as12Area

  // No separate stirrup steel grade input exists, so f_ywd is assumed equal to f_yd.
  const fywd = fyd
  const aswHCase1 = (0.5 * fVSd * 1000) / fywd
  const aswHCase2 = 0.5 * (as11Area + as12Area)
  const aswHCase3 = 0.3 * (as11Area + as12Area)
  const aswH = aFh <= 0.3 ? aswHCase1 : aFh <= 0.6 ? aswHCase2 : aswHCase3

  const rebarSwSingleArea = barArea(rebarSwDiameter)
  const rebarSwCount = legsForArea(aswH, rebarSwDiameter)
  const aswHArea = Math.round(rebarSwCount * rebarSwSingleArea)

  // Vertical stirrup checks: concrete shear capacity without transverse reinforcement.
  const beta = d > 0 ? aF / (2 * d) : 0
  const kFactor = Math.min(d > 0 ? 1 + Math.sqrt(200 / d) : 2, 2)
  const bdProduct = bDim * d
  const rhoL = bdProduct > 0 ? (as11Area + as12Area) / bdProduct : 0
  const vRdc = (0.129 * kFactor * Math.cbrt(100 * rhoL * fck) * bDim * d) / 1000

  // Required vertical stirrup area: not needed at all for low aF/h; otherwise its formula depends
  // on whether the concrete alone (V_Rd,c) already covers the shear or not.
  const linkCase1 = aFh <= 0.5
  const linkCase2 = aFh > 0.5 && vRdc < fVSd
  const linkCase3 = aFh > 0.5 && vRdc >= fVSd
  const asLink = linkCase1
    ? 0
    : linkCase2
      ? 0.5 * (fVSd / (fyd / 1000))
      : z > 0
        ? (((2 * aDist) / z - 1) / (3 * (fyd / 1000))) * fVSd
        : 0

  const rebar31SingleArea = barArea(rebar31Diameter)
  const rebar31Count = legsForArea(asLink, rebar31Diameter)
  const asLinkArea = Math.round(rebar31Count * rebar31SingleArea)

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
    rebarSwSingleArea,
    rebarSwCount,
    aswHArea,
    beta,
    kFactor,
    rhoL,
    vRdc,
    linkCase1,
    linkCase2,
    linkCase3,
    asLink,
    rebar31SingleArea,
    rebar31Count,
    asLinkArea,
  }
}
