import type { CalculatorModule } from './types'
import UnitConverter from './unit-converter/UnitConverter'

export const modules: CalculatorModule[] = [
  { id: 'unit-converter', label: 'Unit Converter', component: UnitConverter },
]
