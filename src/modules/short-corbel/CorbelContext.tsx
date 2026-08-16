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
  rebar11Count: number
  setRebar11Count: (v: number) => void
  rebar11Diameter: number
  setRebar11Diameter: (v: number) => void
  rebar12Count: number
  setRebar12Count: (v: number) => void
  rebar12Diameter: number
  setRebar12Diameter: (v: number) => void
  rebarSwCount: number
  setRebarSwCount: (v: number) => void
  rebarSwDiameter: number
  setRebarSwDiameter: (v: number) => void
  rebar31Count: number
  setRebar31Count: (v: number) => void
  rebar31Diameter: number
  setRebar31Diameter: (v: number) => void
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
  const [rebar11Count, setRebar11Count] = useState(4)
  const [rebar11Diameter, setRebar11Diameter] = useState(16)
  const [rebar12Count, setRebar12Count] = useState(0)
  const [rebar12Diameter, setRebar12Diameter] = useState(8)
  const [rebarSwCount, setRebarSwCount] = useState(8)
  const [rebarSwDiameter, setRebarSwDiameter] = useState(8)
  const [rebar31Count, setRebar31Count] = useState(6)
  const [rebar31Diameter, setRebar31Diameter] = useState(8)

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
        rebar11Count,
        setRebar11Count,
        rebar11Diameter,
        setRebar11Diameter,
        rebar12Count,
        setRebar12Count,
        rebar12Diameter,
        setRebar12Diameter,
        rebarSwCount,
        setRebarSwCount,
        rebarSwDiameter,
        setRebarSwDiameter,
        rebar31Count,
        setRebar31Count,
        rebar31Diameter,
        setRebar31Diameter,
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
