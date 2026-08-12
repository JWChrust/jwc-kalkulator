import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactElement,
  type RefObject,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'
import { Box3, DoubleSide, Shape, Vector3 } from 'three'
import type { Group, OrthographicCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useBeamDappedEnd } from './BeamDappedEndContext'
import { barArea } from '../../components/RebarSelector'
import { GAMMA_S } from '../short-corbel/calculations'
import { getFyk } from '../short-corbel/materials'

const SCALE = 0.01 // 1 three.js unit = 100 mm
const MIN_MM = 1
const BEAM_LENGTH_MM = 2000 // fixed 2m beam, independent of l_k/geometry inputs
const FACE_EPS = 0.02 // pulls each colored overlay just outside the solid to avoid z-fighting
const REBAR_VISUAL_SCALE = 1.6 // true-to-scale bar diameters would be nearly invisible
const BEND_RADIUS_FACTOR = 2 // bend radius = 2 * diameter, applied to every bar shown in the view

function evenlySpaced(count: number, from: number, to: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [(from + to) / 2]
  return Array.from({ length: count }, (_, i) => from + (i * (to - from)) / (count - 1))
}

interface LoopShapeProps {
  halfPrimary: number
  halfZ: number
  radius: number
  color: string
}

/** A closed rectangular loop, flat in its local X-Z plane, built from 4 straight segments joined
 * by 4x⌀ rounded fillets. Rotated 90° about Z by the caller it stands up vertically. */
function LoopShape({ halfPrimary, halfZ, radius, color }: LoopShapeProps) {
  const R = Math.max(
    Math.min(radius * BEND_RADIUS_FACTOR * 2, halfPrimary / 2, halfZ / 2),
    radius * 1.01,
  )
  const primaryLen = Math.max(2 * (halfPrimary - R), 0)
  const widthLen = Math.max(2 * (halfZ - R), 0)
  const torusArgs: [number, number, number, number, number] = [R, radius, 8, 16, Math.PI / 2]

  const corners: { x: number; z: number; rotZ: number }[] = [
    { x: halfPrimary - R, z: halfZ - R, rotZ: 0 },
    { x: -halfPrimary + R, z: halfZ - R, rotZ: Math.PI / 2 },
    { x: -halfPrimary + R, z: -halfZ + R, rotZ: Math.PI },
    { x: halfPrimary - R, z: -halfZ + R, rotZ: -Math.PI / 2 },
  ]

  return (
    <>
      <mesh position={[0, 0, halfZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, primaryLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, -halfZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, primaryLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[halfPrimary, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, widthLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-halfPrimary, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, widthLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {corners.map(({ x, z, rotZ }, i) => (
        <mesh key={i} position={[x, 0, z]} rotation={[Math.PI / 2, 0, rotZ]}>
          <torusGeometry args={torusArgs} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  )
}

interface VerticalStirrupLoopProps {
  x: number
  centerY: number
  rectHeightY: number
  rectWidthZ: number
  radius: number
  color: string
}

/** A closed rectangular stirrup standing in the Y-Z (vertical) plane at a fixed X. */
function VerticalStirrupLoop({ x, centerY, rectHeightY, rectWidthZ, radius, color }: VerticalStirrupLoopProps) {
  return (
    <group position={[x, centerY, 0]} rotation={[0, 0, Math.PI / 2]}>
      <LoopShape halfPrimary={rectHeightY / 2} halfZ={rectWidthZ / 2} radius={radius} color={color} />
    </group>
  )
}

interface CornerHangerProps {
  z: number
  mainLength: number
  h: number
  cover: number
  legExtension: number
  radius: number
  color: string
}

/**
 * A_s21/A_s22 — U-shaped hanger bent around the dapped-end's reentrant corner: along the bottom
 * face, up the notch's vertical face, along the top face, each offset inward by `cover`.
 */
function CornerHanger({ z, mainLength, h, cover, legExtension, radius, color }: CornerHangerProps) {
  const cornerX = mainLength - cover
  const bottomY = cover
  const topY = h - cover
  const R = Math.max(
    Math.min(radius * BEND_RADIUS_FACTOR * 2, legExtension / 2, (topY - bottomY) / 3),
    radius * 1.01,
  )
  const legStartX = Math.max(cornerX - legExtension, 0)

  const bottomLen = Math.max(cornerX - R - legStartX, 0)
  const topLen = bottomLen
  const vertLen = Math.max(topY - R - (bottomY + R), 0)
  const torusArgs: [number, number, number, number, number] = [R, radius, 12, 16, Math.PI / 2]

  return (
    <group position={[0, 0, z]}>
      {/* bottom leg */}
      <mesh position={[(legStartX + cornerX - R) / 2, bottomY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, bottomLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillet: bottom -> vertical (notch face) */}
      <mesh position={[cornerX - R, bottomY + R, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* vertical segment, along the notch's vertical face */}
      <mesh position={[cornerX, (bottomY + R + topY - R) / 2, 0]}>
        <cylinderGeometry args={[radius, radius, vertLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillet: vertical -> top */}
      <mesh position={[cornerX - R, topY - R, 0]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* top leg */}
      <mesh position={[(legStartX + cornerX - R) / 2, topY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, topLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

const FACE_COLORS = {
  bottom: { label: 'spód (belka)', color: '#e74c3c' },
  top: { label: 'góra', color: '#3498db' },
  front: { label: 'przód', color: '#2ecc71' },
  back: { label: 'tył', color: '#9b59b6' },
  left: { label: 'koniec lewy', color: '#f1c40f' },
  right: { label: 'koniec prawy (podcięcie)', color: '#e67e22' },
  step: { label: 'ścianka podcięcia (pion)', color: '#1abc9c' },
  notch: { label: 'spód podcięcia', color: '#e91e63' },
} as const

interface FaceOverlaysProps {
  mainLength: number
  cutHeight: number
  lK_: number
  h: number
  hK_: number
  b: number
  length: number
  profile: Shape
}

/** Flat, unlit, double-sided colored planes coincident with each real face of the beam — purely a
 * reference aid so faces can be identified by color when describing rebar geometry. */
function FaceOverlays({ mainLength, cutHeight, lK_, h, hK_, b, length, profile }: FaceOverlaysProps) {
  return (
    <>
      {/* bottom (main body) */}
      <mesh position={[mainLength / 2, -FACE_EPS, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[mainLength, b]} />
        <meshBasicMaterial color={FACE_COLORS.bottom.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>

      {/* top (full length) */}
      <mesh position={[length / 2, h + FACE_EPS, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, b]} />
        <meshBasicMaterial color={FACE_COLORS.top.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>

      {/* front / back (the L-shaped side profile itself) */}
      <mesh position={[0, 0, b / 2 + FACE_EPS]}>
        <shapeGeometry args={[profile]} />
        <meshBasicMaterial color={FACE_COLORS.front.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -b / 2 - FACE_EPS]}>
        <shapeGeometry args={[profile]} />
        <meshBasicMaterial color={FACE_COLORS.back.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>

      {/* left end (full height) */}
      <mesh position={[-FACE_EPS, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[b, h]} />
        <meshBasicMaterial color={FACE_COLORS.left.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>

      {/* right end (dapped tip, only h_k tall) */}
      <mesh position={[length + FACE_EPS, cutHeight + hK_ / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[b, hK_]} />
        <meshBasicMaterial color={FACE_COLORS.right.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>

      {/* notch riser (vertical face exposed by the cut) */}
      <mesh position={[mainLength + FACE_EPS, cutHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[b, cutHeight]} />
        <meshBasicMaterial color={FACE_COLORS.step.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>

      {/* notch underside (horizontal face exposed by the cut, under the dapped tip) */}
      <mesh position={[mainLength + lK_ / 2, cutHeight - FACE_EPS, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[lK_, b]} />
        <meshBasicMaterial color={FACE_COLORS.notch.color} transparent opacity={0.55} side={DoubleSide} />
      </mesh>
    </>
  )
}

function BeamScene() {
  const {
    hDim,
    hK,
    lK,
    aK,
    bDim,
    vEd,
    steelGrade,
    rebar31Count,
    rebar31Diameter,
    rebar32Count,
    rebar32Diameter,
    rebar33Diameter,
  } = useBeamDappedEnd()

  const h = Math.max(Number(hDim) || 0, MIN_MM) * SCALE
  const hKRaw = Math.max(Number(hK) || 0, MIN_MM)
  const hK_ = Math.min(hKRaw, Number(hDim) || hKRaw) * SCALE
  const b = Math.max(Number(bDim) || 0, MIN_MM) * SCALE
  const length = BEAM_LENGTH_MM * SCALE
  const lKRaw = Math.max(Number(lK) || 0, MIN_MM)
  const lK_ = Math.min(lKRaw, BEAM_LENGTH_MM) * SCALE

  const mainLength = Math.max(length - lK_, MIN_MM * SCALE)
  const cutHeight = Math.max(h - hK_, 0)

  // d_k in mm (unscaled), used for the A_s21/A_s22 leg-extension length below.
  const dKMm = (Number(hK) || 0) - (Number(aK) || 0)

  // A_s23's loop count — mirrors BeamDappedEndResults.tsx's own A_swp / A_s23 calculation chain.
  const vEdNum = Number(vEd) || 0
  const hSd = 0.2 * vEdNum
  const fyk = getFyk(steelGrade)
  const fyd = fyk / GAMMA_S
  const aswp = (1.3 * vEdNum + 0.3 * hSd) / (fyd / 1000)
  const as21Area = Math.round(rebar31Count * barArea(rebar31Diameter))
  const as22Area = Math.round(rebar32Count * barArea(rebar32Diameter))
  const aswp23Required = Math.max(aswp - as21Area - as22Area, 0)
  const rebar33SingleArea = barArea(rebar33Diameter)
  const rebar33RawCount = rebar33SingleArea > 0 ? Math.ceil(aswp23Required / rebar33SingleArea) : 0
  const as23Count = Math.ceil(rebar33RawCount / 2) // number of closed loops (2 legs each)

  // A_s21/A_s22 — U-shaped hangers wrapping bottom -> notch face -> top, evenly spread across the
  // width with the given front/back cover; A_s23 — full-height stirrups near the notch edge.
  const cover21 = (35 + 0.5 * rebar31Diameter) * SCALE
  const margin21 = 70 * SCALE
  const halfSpanZ21 = Math.max(b / 2 - margin21, 0)
  const z21Positions = evenlySpaced(rebar31Count, -halfSpanZ21, halfSpanZ21)
  const legExtension21 = Math.min(
    Math.max(((Number(hDim) || 0) - dKMm + 50 * rebar31Diameter) * SCALE, 0),
    mainLength - cover21,
  )
  const barRadius21 = (rebar31Diameter / 2) * SCALE * REBAR_VISUAL_SCALE

  const cover22 = (35 + 0.5 * rebar32Diameter) * SCALE
  const margin22 = 85 * SCALE
  const halfSpanZ22 = Math.max(b / 2 - margin22, 0)
  const z22Positions = evenlySpaced(rebar32Count, -halfSpanZ22, halfSpanZ22)
  const legExtension22 = Math.min(
    Math.max(((Number(hDim) || 0) - dKMm + 50 * rebar32Diameter) * SCALE, 0),
    mainLength - cover22,
  )
  const barRadius22 = (rebar32Diameter / 2) * SCALE * REBAR_VISUAL_SCALE

  const stirrupCover = (25 + 0.5 * rebar33Diameter) * SCALE
  const barRadius23 = (rebar33Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  const stirrup23RectHeightY = Math.max(h - 2 * stirrupCover, stirrupCover)
  const stirrup23RectWidthZ = Math.max(b - 2 * stirrupCover, stirrupCover)
  const firstStirrup23X = mainLength - 50 * SCALE
  const stirrup23Spacing = 20 * SCALE
  const x23Positions = Array.from({ length: as23Count }, (_, i) => firstStirrup23X - i * stirrup23Spacing).filter(
    (x) => x > 0,
  )

  // Side-view outline of the beam, dapped at one end: full height h up to mainLength, then
  // stepped down to height h_k over the remaining l_k. Extruded once along the width (b) so the
  // whole beam is a single mesh — no seam line where a main-body box would meet an end-box.
  const profile = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0)
    s.lineTo(mainLength, 0)
    s.lineTo(mainLength, cutHeight)
    s.lineTo(mainLength + lK_, cutHeight)
    s.lineTo(mainLength + lK_, h)
    s.lineTo(0, h)
    s.closePath()
    return s
  }, [mainLength, cutHeight, lK_, h])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} />

      <mesh position={[0, 0, -b / 2]}>
        <extrudeGeometry args={[profile, { depth: b, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="lightgray"
          transparent
          opacity={0.35}
          roughness={0.8}
          side={DoubleSide}
          depthWrite={false}
        />
        <Edges color="black" />
      </mesh>

      <FaceOverlays
        mainLength={mainLength}
        cutHeight={cutHeight}
        lK_={lK_}
        h={h}
        hK_={hK_}
        b={b}
        length={length}
        profile={profile}
      />

      {/* A_s21 — red corner hangers */}
      {z21Positions.map((z, i) => (
        <CornerHanger
          key={i}
          z={z}
          mainLength={mainLength}
          h={h}
          cover={cover21}
          legExtension={legExtension21}
          radius={barRadius21}
          color="red"
        />
      ))}

      {/* A_s22 — turquoise corner hangers, nested just inside A_s21 */}
      {z22Positions.map((z, i) => (
        <CornerHanger
          key={i}
          z={z}
          mainLength={mainLength}
          h={h}
          cover={cover22}
          legExtension={legExtension22}
          radius={barRadius22}
          color="turquoise"
        />
      ))}

      {/* A_s23 — yellow full-height stirrups, starting 30mm from the notch edge, every 20mm */}
      {x23Positions.map((x, i) => (
        <VerticalStirrupLoop
          key={i}
          x={x}
          centerY={h / 2}
          rectHeightY={stirrup23RectHeightY}
          rectWidthZ={stirrup23RectWidthZ}
          radius={barRadius23}
          color="yellow"
        />
      ))}
    </>
  )
}

type ViewPreset = 'iso' | 'top' | 'side' | 'front'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IsoIcon() {
  return (
    <svg {...ICON_PROPS} className="h-3.5 w-3.5 shrink-0">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function TopIcon() {
  return (
    <svg {...ICON_PROPS} className="h-3.5 w-3.5 shrink-0">
      <rect x="5" y="10" width="14" height="10" rx="1" />
      <path d="M12 2v5" />
      <polyline points="9 4 12 7 15 4" />
    </svg>
  )
}

function SideIcon() {
  return (
    <svg {...ICON_PROPS} className="h-3.5 w-3.5 shrink-0">
      <rect x="4" y="6" width="10" height="14" rx="1" />
      <path d="M22 13h-5" />
      <polyline points="20 10 17 13 20 16" />
    </svg>
  )
}

function FrontIcon() {
  return (
    <svg {...ICON_PROPS} className="h-3.5 w-3.5 shrink-0">
      <rect x="5" y="4" width="14" height="10" rx="1" />
      <path d="M12 22v-5" />
      <polyline points="9 20 12 17 15 20" />
    </svg>
  )
}

const viewButtons: { preset: ViewPreset; label: string; Icon: () => ReactElement }[] = [
  { preset: 'iso', label: 'Widok podstawowy', Icon: IsoIcon },
  { preset: 'top', label: 'Widok z góry', Icon: TopIcon },
  { preset: 'side', label: 'Widok z boku', Icon: SideIcon },
  { preset: 'front', label: 'Widok od frontu', Icon: FrontIcon },
]

const VIEW_DIRECTIONS: Record<ViewPreset, [number, number, number]> = {
  iso: [1, 1, 1],
  top: [0, 1, 0.001], // tiny Z bias avoids the degenerate up-vector at a pure top-down angle
  side: [0, 0, 1],
  front: [1, 0, 0],
}

const FIT_MARGIN = 1.15 // headroom so the model doesn't touch the pane edges

interface ViewControllerHandle {
  fitView: (preset: ViewPreset) => void
}

/** Lives inside the Canvas so it can read the live scene bounds and viewport size. */
const ViewController = forwardRef<
  ViewControllerHandle,
  { controlsRef: RefObject<OrbitControlsImpl | null>; sceneRef: RefObject<Group | null> }
>(function ViewController({ controlsRef, sceneRef }, ref) {
  const { size } = useThree()

  useImperativeHandle(ref, () => ({
    fitView(preset) {
      const controls = controlsRef.current
      const group = sceneRef.current
      if (!controls || !group) return
      const camera = controls.object as OrthographicCamera

      const box = new Box3().setFromObject(group)
      if (box.isEmpty()) return
      const center = box.getCenter(new Vector3())
      const radius = Math.max(box.getSize(new Vector3()).length(), 1)

      const dir = new Vector3(...VIEW_DIRECTIONS[preset]).normalize()
      camera.position.copy(center).addScaledVector(dir, radius * 2)
      camera.up.set(0, 1, 0)
      camera.lookAt(center)
      camera.updateMatrixWorld()

      const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
      const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1)

      let halfW = 0.01
      let halfH = 0.01
      const corner = new Vector3()
      for (let i = 0; i < 8; i++) {
        corner
          .set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
          .sub(center)
        halfW = Math.max(halfW, Math.abs(corner.dot(right)))
        halfH = Math.max(halfH, Math.abs(corner.dot(up)))
      }

      const zoom = Math.min(
        size.width / (2 * halfW * FIT_MARGIN),
        size.height / (2 * halfH * FIT_MARGIN),
      )
      if (Number.isFinite(zoom) && zoom > 0) {
        camera.zoom = zoom
        camera.updateProjectionMatrix()
      }

      controls.target.copy(center)
      controls.update()
    },
  }))

  return null
})

/** Fits the default isometric view once, as soon as the scene bounds are known. */
function InitialFit({ viewControllerRef }: { viewControllerRef: RefObject<ViewControllerHandle | null> }) {
  useEffect(() => {
    viewControllerRef.current?.fitView('iso')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function BeamDappedEndView() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const sceneRef = useRef<Group>(null)
  const viewControllerRef = useRef<ViewControllerHandle>(null)

  const applyView = (preset: ViewPreset) => viewControllerRef.current?.fitView(preset)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
        {viewButtons.map(({ preset, label, Icon }) => (
          <button
            key={preset}
            type="button"
            onClick={() => applyView(preset)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none"
          >
            {label}
            <Icon />
          </button>
        ))}
      </div>

      <Canvas orthographic dpr={[1, 2]} camera={{ position: [8, 8, 8], zoom: 50, near: 0.1, far: 1000 }}>
        <group ref={sceneRef}>
          <BeamScene />
        </group>
        <ViewController ref={viewControllerRef} controlsRef={controlsRef} sceneRef={sceneRef} />
        <InitialFit viewControllerRef={viewControllerRef} />
        <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} />
      </Canvas>

      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 rounded-md border border-slate-300 bg-white/90 px-2 py-1.5">
        {Object.values(FACE_COLORS).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[14px] text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BeamDappedEndView
