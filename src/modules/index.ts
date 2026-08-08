import type { CalculatorModule } from './types'
import UnitConverter from './unit-converter/UnitConverter'
import CorbelInputs from './short-corbel/CorbelInputs'
import CorbelResults from './short-corbel/CorbelResults'
import { CorbelProvider } from './short-corbel/CorbelContext'

export const modules: CalculatorModule[] = [
  {
    id: 'short-corbel-reinforcement',
    label: 'Zbrojenie wsporników krótkich',
    panes: { left: CorbelInputs, center: CorbelResults },
    provider: CorbelProvider,
  },
  { id: 'unit-converter', label: 'Unit Converter', panes: { center: UnitConverter } },
]
