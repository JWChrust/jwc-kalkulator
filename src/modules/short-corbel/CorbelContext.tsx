import { createContext, useContext, useState, type ReactNode } from 'react'

interface CorbelState {
  concreteClass: string
  setConcreteClass: (v: string) => void
  steelGrade: string
  setSteelGrade: (v: string) => void
  fVSd: string
  setFVSd: (v: string) => void
  aF: string
  setAF: (v: string) => void
  aH: string
  setAH: (v: string) => void
  hDim: string
  setHDim: (v: string) => void
  bDim: string
  setBDim: (v: string) => void
}

const CorbelContext = createContext<CorbelState | null>(null)

export function CorbelProvider({ children }: { children: ReactNode }) {
  const [concreteClass, setConcreteClass] = useState('C50/60')
  const [steelGrade, setSteelGrade] = useState('RB500W [A-IIIN]')
  const [fVSd, setFVSd] = useState('200')
  const [aF, setAF] = useState('160')
  const [aH, setAH] = useState('60')
  const [hDim, setHDim] = useState('300')
  const [bDim, setBDim] = useState('400')

  return (
    <CorbelContext.Provider
      value={{
        concreteClass,
        setConcreteClass,
        steelGrade,
        setSteelGrade,
        fVSd,
        setFVSd,
        aF,
        setAF,
        aH,
        setAH,
        hDim,
        setHDim,
        bDim,
        setBDim,
      }}
    >
      {children}
    </CorbelContext.Provider>
  )
}

export function useCorbel(): CorbelState {
  const ctx = useContext(CorbelContext)
  if (!ctx) {
    throw new Error('useCorbel must be used within CorbelProvider')
  }
  return ctx
}
