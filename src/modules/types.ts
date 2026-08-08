import type { ComponentType } from 'react'

export interface CalculatorModule {
  id: string
  label: string
  component: ComponentType
}
