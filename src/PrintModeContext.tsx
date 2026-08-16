import { createContext, useContext } from 'react'

const PrintModeContext = createContext(false)

export function usePrintMode(): boolean {
  return useContext(PrintModeContext)
}

export default PrintModeContext
