export const CONCRETE_CLASSES = [
  'C20/25',
  'C25/30',
  'C30/37',
  'C35/45',
  'C40/50',
  'C45/55',
  'C50/60',
  'C55/67',
  'C60/75',
] as const

/** Characteristic cylinder compressive strength f_ck [MPa], per EC2 Table 3.1. */
export const CONCRETE_FCK: Record<string, number> = {
  'C20/25': 20,
  'C25/30': 25,
  'C30/37': 30,
  'C35/45': 35,
  'C40/50': 40,
  'C45/55': 45,
  'C50/60': 50,
  'C55/67': 55,
  'C60/75': 60,
}

export const STEEL_GRADES = [
  'RB500W [A-IIIN]',
  'B500SP [A-IIIN]',
  'B500B [A-IIIN]',
  '34GS [A-II]',
  'St3S-b [A-I]',
] as const

/** Characteristic yield strength f_yk [MPa]. */
export const STEEL_FYK: Record<string, number> = {
  'RB500W [A-IIIN]': 500,
  'B500SP [A-IIIN]': 500,
  'B500B [A-IIIN]': 500,
  '34GS [A-II]': 355,
  'St3S-b [A-I]': 220,
}

export function getFck(concreteClass: string): number {
  return CONCRETE_FCK[concreteClass] ?? 0
}

export function getFyk(steelGrade: string): number {
  return STEEL_FYK[steelGrade] ?? 0
}
