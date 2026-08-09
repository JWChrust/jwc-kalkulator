import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { DoubleSide } from 'three'
import { useCorbel } from './CorbelContext'
import { computeCorbelResult } from './calculations'

const SCALE = 0.01 // 1 three.js unit = 100 mm
const MIN_MM = 1
const EMBED_MM = 20
const COVER_MM = 25
const REBAR_VISUAL_SCALE = 1.6 // true-to-scale bar diameters would be nearly invisible
const MAX_STIRRUPS = 60

function evenlySpaced(count: number, from: number, to: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [(from + to) / 2]
  return Array.from({ length: count }, (_, i) => from + (i * (to - from)) / (count - 1))
}

interface StirrupLoopProps {
  x: number
  centerY: number
  rectWidth: number
  rectHeight: number
  radius: number
  color: string
}

/** A closed rectangular stirrup, built from 4 straight segments + 4 corner joints. */
function StirrupLoop({ x, centerY, rectWidth, rectHeight, radius, color }: StirrupLoopProps) {
  const halfW = rectWidth / 2
  const halfH = rectHeight / 2
  const corners: [number, number][] = [
    [halfH, halfW],
    [halfH, -halfW],
    [-halfH, halfW],
    [-halfH, -halfW],
  ]

  return (
    <group position={[x, centerY, 0]}>
      <mesh position={[0, 0, halfW]}>
        <cylinderGeometry args={[radius, radius, rectHeight, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, -halfW]}>
        <cylinderGeometry args={[radius, radius, rectHeight, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, rectWidth, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, rectWidth, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {corners.map(([y, z], i) => (
        <mesh key={i} position={[0, y, z]}>
          <sphereGeometry args={[radius, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

function CorbelScene() {
  const {
    fVSd,
    aF,
    aH,
    hDim,
    bDim,
    concreteClass,
    steelGrade,
    rebar11Count,
    rebar11Diameter,
    rebar12Diameter,
  } = useCorbel()

  const calc = computeCorbelResult({
    fVSd: Number(fVSd) || 0,
    aF: Number(aF) || 0,
    aH: Number(aH) || 0,
    hDim: Number(hDim) || 0,
    bDim: Number(bDim) || 0,
    concreteClass,
    steelGrade,
    rebar11Count,
    rebar11Diameter,
    rebar12Diameter,
  })

  const h = Math.max(Number(hDim) || 0, MIN_MM) * SCALE
  const b = Math.max(Number(bDim) || 0, MIN_MM) * SCALE
  const aFScene = Math.max(Number(aF) || 0, MIN_MM) * SCALE
  const embed = EMBED_MM * SCALE
  const cover = COVER_MM * SCALE

  const stirrupCount = Number.isFinite(calc.rebar12Count)
    ? Math.min(Math.max(calc.rebar12Count, 0), MAX_STIRRUPS)
    : 0

  const barRadius11 = (rebar11Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  const barRadius12 = (rebar12Diameter / 2) * SCALE * REBAR_VISUAL_SCALE

  const columnHeight = h * 2.5
  const columnCenterY = h * 0.75

  const halfSpanZ = Math.max(b / 2 - cover, 0)
  const barZPositions = evenlySpaced(rebar11Count, -halfSpanZ, halfSpanZ)
  const barX = Math.max(aFScene - cover, cover)

  const stirrupRectWidth = Math.max(b - 2 * cover, cover)
  const stirrupRectHeight = Math.max(h - 2 * cover, cover)
  const stirrupXPositions = evenlySpaced(stirrupCount, cover, Math.max(aFScene - cover, cover))

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} />

      {/* Column stub */}
      <mesh position={[-h / 2, columnCenterY, 0]}>
        <boxGeometry args={[h, columnHeight, b]} />
        <meshStandardMaterial
          color="lightgray"
          transparent
          opacity={0.35}
          roughness={0.8}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Corbel nib */}
      <mesh position={[(aFScene - embed) / 2, h / 2, 0]}>
        <boxGeometry args={[aFScene + embed, h, b]} />
        <meshStandardMaterial
          color="lightgray"
          transparent
          opacity={0.35}
          roughness={0.8}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* A_s11 — vertical main tie bars */}
      {barZPositions.map((z, i) => (
        <mesh key={i} position={[barX, h / 2, z]}>
          <cylinderGeometry args={[barRadius11, barRadius11, h, 12]} />
          <meshStandardMaterial color="purple" />
        </mesh>
      ))}

      {/* A_s12 — horizontal stirrup loops */}
      {stirrupXPositions.map((x, i) => (
        <StirrupLoop
          key={i}
          x={x}
          centerY={h / 2}
          rectWidth={stirrupRectWidth}
          rectHeight={stirrupRectHeight}
          radius={barRadius12}
          color="darkorange"
        />
      ))}
    </>
  )
}

function Corbel3DView() {
  return (
    <div className="h-full w-full overflow-hidden">
      <Canvas dpr={[1, 2]} camera={{ position: [6, 5, 7], fov: 45 }}>
        <CorbelScene />
        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  )
}

export default Corbel3DView
