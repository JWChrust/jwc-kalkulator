import type { CalculatorModule } from './types'
import UnitConverter from './unit-converter/UnitConverter'
import CorbelInputs from './short-corbel/CorbelInputs'
import CorbelResults from './short-corbel/CorbelResults'
import Corbel3DView from './short-corbel/Corbel3DView'
import { CorbelProvider } from './short-corbel/CorbelContext'
import BeamDappedEndInputs from './beam-dapped-end/BeamDappedEndInputs'
import BeamDappedEndResults from './beam-dapped-end/BeamDappedEndResults'
import BeamDappedEndView from './beam-dapped-end/BeamDappedEndView'
import { BeamDappedEndProvider } from './beam-dapped-end/BeamDappedEndContext'

export const modules: CalculatorModule[] = [
  {
    id: 'short-corbel-reinforcement',
    label: 'Zbrojenie wsporników krótkich',
    panes: { left: CorbelInputs, center: CorbelResults, right: Corbel3DView },
    provider: CorbelProvider,
  },
  {
    id: 'beam-dapped-end-reinforcement',
    label: 'Zbrojenie podcięcia w belce',
    panes: { left: BeamDappedEndInputs, center: BeamDappedEndResults, right: BeamDappedEndView },
    provider: BeamDappedEndProvider,
  },
  { id: 'unit-converter', label: 'Unit Converter', panes: { center: UnitConverter } },
]
