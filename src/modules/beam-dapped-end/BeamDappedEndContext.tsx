import { createContext, useContext, useState, type ReactNode } from 'react'

interface BeamDappedEndState {
  concreteClass: string
  setConcreteClass: (v: string) => void
  steelGrade: string
  setSteelGrade: (v: string) => void
  vEd: string
  setVEd: (v: string) => void
  aV: string
  setAV: (v: string) => void
  aK: string
  setAK: (v: string) => void
  hDim: string
  setHDim: (v: string) => void
  hK: string
  setHK: (v: string) => void
  bDim: string
  setBDim: (v: string) => void
  lK: string
  setLK: (v: string) => void
  rebar11Count: number
  setRebar11Count: (v: number) => void
  rebar11Diameter: number
  setRebar11Diameter: (v: number) => void
  rebar12Count: number
  setRebar12Count: (v: number) => void
  rebar12Diameter: number
  setRebar12Diameter: (v: number) => void
  rebar13Count: number
  setRebar13Count: (v: number) => void
  rebar13Diameter: number
  setRebar13Diameter: (v: number) => void
  rebar21Diameter: number
  setRebar21Diameter: (v: number) => void
  rebar31Count: number
  setRebar31Count: (v: number) => void
  rebar31Diameter: number
  setRebar31Diameter: (v: number) => void
  rebar32Count: number
  setRebar32Count: (v: number) => void
  rebar32Diameter: number
  setRebar32Diameter: (v: number) => void
  rebar33Count: number
  setRebar33Count: (v: number) => void
  rebar33Diameter: number
  setRebar33Diameter: (v: number) => void
}

const BeamDappedEndContext = createContext<BeamDappedEndState | null>(null)

export function BeamDappedEndProvider({ children }: { children: ReactNode }) {
  const [concreteClass, setConcreteClass] = useState('C50/60')
  const [steelGrade, setSteelGrade] = useState('RB500W [A-IIIN]')
  const [vEd, setVEd] = useState('200')
  const [aV, setAV] = useState('150')
  const [aK, setAK] = useState('150')
  const [hDim, setHDim] = useState('500')
  const [hK, setHK] = useState('300')
  const [bDim, setBDim] = useState('300')
  const [lK, setLK] = useState('300')
  const [rebar11Count, setRebar11Count] = useState(2)
  const [rebar11Diameter, setRebar11Diameter] = useState(16)
  const [rebar12Count, setRebar12Count] = useState(4)
  const [rebar12Diameter, setRebar12Diameter] = useState(12)
  const [rebar13Count, setRebar13Count] = useState(3)
  const [rebar13Diameter, setRebar13Diameter] = useState(10)
  const [rebar21Diameter, setRebar21Diameter] = useState(8)
  const [rebar31Count, setRebar31Count] = useState(2)
  const [rebar31Diameter, setRebar31Diameter] = useState(16)
  const [rebar32Count, setRebar32Count] = useState(4)
  const [rebar32Diameter, setRebar32Diameter] = useState(12)
  const [rebar33Count, setRebar33Count] = useState(3)
  const [rebar33Diameter, setRebar33Diameter] = useState(10)

  return (
    <BeamDappedEndContext.Provider
      value={{
        concreteClass,
        setConcreteClass,
        steelGrade,
        setSteelGrade,
        vEd,
        setVEd,
        aV,
        setAV,
        aK,
        setAK,
        hDim,
        setHDim,
        hK,
        setHK,
        bDim,
        setBDim,
        lK,
        setLK,
        rebar11Count,
        setRebar11Count,
        rebar11Diameter,
        setRebar11Diameter,
        rebar12Count,
        setRebar12Count,
        rebar12Diameter,
        setRebar12Diameter,
        rebar13Count,
        setRebar13Count,
        rebar13Diameter,
        setRebar13Diameter,
        rebar21Diameter,
        setRebar21Diameter,
        rebar31Count,
        setRebar31Count,
        rebar31Diameter,
        setRebar31Diameter,
        rebar32Count,
        setRebar32Count,
        rebar32Diameter,
        setRebar32Diameter,
        rebar33Count,
        setRebar33Count,
        rebar33Diameter,
        setRebar33Diameter,
      }}
    >
      {children}
    </BeamDappedEndContext.Provider>
  )
}

export function useBeamDappedEnd(): BeamDappedEndState {
  const ctx = useContext(BeamDappedEndContext)
  if (!ctx) {
    throw new Error('useBeamDappedEnd must be used within BeamDappedEndProvider')
  }
  return ctx
}
