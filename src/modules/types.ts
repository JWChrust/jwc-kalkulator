import type { ComponentType, ReactNode } from 'react'

export type PaneKey = 'left' | 'center' | 'right'

export interface CalculatorModule {
  id: string
  label: string
  panes: Partial<Record<PaneKey, ComponentType>>
  /** Wraps all panes so they can share state (e.g. inputs feeding a results pane). */
  provider?: ComponentType<{ children: ReactNode }>
}
