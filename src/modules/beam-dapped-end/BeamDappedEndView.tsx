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
import Legend3D, { type Legend3DItem } from '../../components/Legend3D'
import { usePrintMode } from '../../PrintModeContext'

const SCALE = 0.01 // 1 three.js unit = 100 mm
const MIN_MM = 1
const BEAM_LENGTH_MM = 2000 // fixed 2m beam, independent of l_k/geometry inputs
const REBAR_VISUAL_SCALE = 1.6 // true-to-scale bar diameters would be nearly invisible
const BEND_RADIUS_FACTOR = 2 // bend radius = 2 * diameter, applied to every bar shown in the view

/** Cover accounting for the enclosing A_s23 stirrup: the greater of 25mm + ⌀A_s23 or 25mm + 8mm. */
export function computeCover(as23Diameter: number): number {
  return Math.max(25 + as23Diameter, 25 + 8)
}

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
  cornerX: number
  bottomY: number
  topY: number
  legExtension: number
  radius: number
  color: string
}

/**
 * A_s21/A_s22/A_s12/A_s13 — U-shaped hanger bent around a reentrant corner: along a bottom face,
 * up a vertical face at `cornerX`, along a top face, each offset inward by the caller's cover.
 */
function CornerHanger({ z, cornerX, bottomY, topY, legExtension, radius, color }: CornerHangerProps) {
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

interface EndHangerProps {
  y: number
  cornerX: number
  frontZ: number
  backZ: number
  legExtension: number
  radius: number
  color: string
}

/**
 * A_s11/A_s31 — horizontal U-shaped hanger wrapping the beam's right end in plan: along the front
 * face, around the right end, along the back face, each offset inward by the caller's cover.
 * Reuses CornerHanger's already-verified bend geometry, rotated so its Y-axis bend (which
 * CornerHanger builds correctly) becomes a Z-axis bend instead — avoids re-deriving fillet
 * rotations by hand for a second time.
 */
function EndHanger({ y, cornerX, frontZ, backZ, legExtension, radius, color }: EndHangerProps) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <CornerHanger
        z={-y}
        cornerX={cornerX}
        bottomY={backZ}
        topY={frontZ}
        legExtension={legExtension}
        radius={radius}
        color={color}
      />
    </group>
  )
}

function BeamScene() {
  const {
    hDim,
    hK,
    lK,
    aK,
    aV,
    bDim,
    rebar11Count,
    rebar11Diameter,
    rebar11Phase,
    rebar12Count,
    rebar12Diameter,
    rebar13Count,
    rebar13Diameter,
    rebar21Count,
    rebar21Diameter,
    rebar31Count,
    rebar31Diameter,
    rebar32Count,
    rebar32Diameter,
    rebar33Count,
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

  // A_s23 — manually picked (v1, x2 toggle default); its count is a leg count, 2 legs = 1 closed loop.
  const as23Count = Math.floor(rebar33Count / 2)

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
  const margin22 = 100 * SCALE
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

  // Which A_s31 geometry variant applies: horizontal U-inserts ("strzemiona poziome") when
  // a_v/h_k <= 0.5, full-tip-depth stirrups ("strzemiona pionowe") otherwise.
  const aVNum = Number(aV) || 0
  const hKNum = Number(hK) || 0
  const avHk = hKNum > 0 ? aVNum / hKNum : 0
  const linkCase1 = avHk <= 0.5
  const linkCase2 = !linkCase1
  const count31 = rebar21Count // manually picked, like the v1 selectors

  // A_s11 — horizontal U-inserts wrapping the right end in plan, stacked from just above the
  // notch underside; A_s31 continues the same stack (30mm gap) up to a 50mm top cover.
  const cover11FrontBack = (35 + 0.5 * rebar11Diameter) * SCALE
  const cover11End = (25 + 0.5 * rebar11Diameter) * SCALE
  const corner11X = length - cover11End
  const front11Z = b / 2 - cover11FrontBack
  const back11Z = -b / 2 + cover11FrontBack

  const cover31FrontBack = (35 + 0.5 * rebar21Diameter) * SCALE
  const cover31End = (25 + 0.5 * rebar21Diameter) * SCALE
  const corner31X = length - cover31End
  const front31Z = b / 2 - cover31FrontBack
  const back31Z = -b / 2 + cover31FrontBack

  const legExtensionEnd = (diameter: number) =>
    Math.max(((Number(hDim) || 0) - dKMm + (Number(hK) || 0) + 50 * diameter) * SCALE, 0)

  // A_s11's toggle defaults to x2 (count is picked in pairs), so the number of rows actually
  // drawn is half the selected count, regardless of phase.
  const bars11Count = Math.floor(rebar11Count / 2)
  const y11Base = cutHeight + 50 * SCALE
  const y11Step = (rebar11Diameter + 3) * SCALE
  const y11Positions = Array.from({ length: bars11Count }, (_, i) => y11Base + i * y11Step)
  const lastY11 = bars11Count > 0 ? y11Positions[bars11Count - 1] : null

  // At x4, each row is drawn as two shorter U-inserts placed side by side in plan ("UU") instead of
  // one long one — each spanning half the front/back width and reaching only to mid-span - 15mm.
  const rebar11DoubleRow = rebar11Phase === 2
  const barRadius11 = (rebar11Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  const halfSpanLegExtension11 = Math.max(length / 2 - 15 * SCALE, 0)
  const mid11Z = (front11Z + back11Z) / 2
  const midGap11 = 10 * SCALE // 20mm total gap between the two rows' inner ("middle") legs

  const y31First = (lastY11 ?? cutHeight) + (lastY11 !== null ? 30 * SCALE : 50 * SCALE)
  const y31Top = h - 50 * SCALE
  const y31Positions =
    count31 <= 0
      ? []
      : count31 === 1
        ? [y31First]
        : Array.from({ length: count31 }, (_, i) => y31First + (i * (y31Top - y31First)) / (count31 - 1))

  // A_s31 (zbrojenie uzupełniające, pionowe case) — stirrups within the dapped tip, reaching down
  // to the notch underside (not the full beam depth): first at the line where the cross-section
  // changes (x=mainLength), last (a_v-20mm) further toward the right end.
  const stirrup31Cover = (25 + 0.5 * rebar21Diameter) * SCALE
  const barRadius31 = (rebar21Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  const stirrup31RectHeightY = Math.max(hK_ - 2 * stirrup31Cover, stirrup31Cover)
  const stirrup31RectWidthZ = Math.max(b - 2 * stirrup31Cover, stirrup31Cover)
  const stirrup31CenterY = cutHeight + hK_ / 2
  const x31First = mainLength
  const x31Last = mainLength + Math.max(aVNum - 20, 0) * SCALE
  const x31Positions =
    count31 <= 0
      ? []
      : count31 === 1
        ? [x31First]
        : Array.from({ length: count31 }, (_, i) => x31First + (i * (x31Last - x31First)) / (count31 - 1))

  // A_s12/A_s13 — vertical U-inserts wrapping the right end: notch underside -> right end -> top.
  const cover12 = (35 + 0.5 * rebar12Diameter) * SCALE
  const margin12 = 70 * SCALE
  const halfSpanZ12 = Math.max(b / 2 - margin12, 0)
  const z12Positions = evenlySpaced(rebar12Count, -halfSpanZ12, halfSpanZ12)
  const barRadius12 = (rebar12Diameter / 2) * SCALE * REBAR_VISUAL_SCALE

  const cover13 = (35 + 0.5 * rebar13Diameter) * SCALE
  const margin13 = 100 * SCALE
  const halfSpanZ13 = Math.max(b / 2 - margin13, 0)
  const z13Positions = evenlySpaced(rebar13Count, -halfSpanZ13, halfSpanZ13)
  const barRadius13 = (rebar13Diameter / 2) * SCALE * REBAR_VISUAL_SCALE

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

      {/* A_s21 — red corner hangers */}
      {z21Positions.map((z, i) => (
        <CornerHanger
          key={i}
          z={z}
          cornerX={mainLength - cover21}
          bottomY={cover21}
          topY={h - cover21}
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
          cornerX={mainLength - cover22}
          bottomY={cover22}
          topY={h - cover22}
          legExtension={legExtension22}
          radius={barRadius22}
          color="turquoise"
        />
      ))}

      {/* A_s23 — yellow full-height stirrups, starting 50mm from the notch edge, every 20mm */}
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

      {/* A_s11 — purple horizontal U-inserts wrapping the right end, stacked from the notch underside.
          At x4, each row is two shorter U-inserts side by side in plan ("UU"), each spanning half the
          front/back width, reaching to mid-span instead of one long insert. */}
      {y11Positions.map((y, i) =>
        rebar11DoubleRow ? (
          <group key={i}>
            <EndHanger
              y={y}
              cornerX={corner11X}
              frontZ={front11Z}
              backZ={mid11Z + midGap11}
              legExtension={halfSpanLegExtension11}
              radius={barRadius11}
              color="purple"
            />
            <EndHanger
              y={y}
              cornerX={corner11X}
              frontZ={mid11Z - midGap11}
              backZ={back11Z}
              legExtension={halfSpanLegExtension11}
              radius={barRadius11}
              color="purple"
            />
          </group>
        ) : (
          <EndHanger
            key={i}
            y={y}
            cornerX={corner11X}
            frontZ={front11Z}
            backZ={back11Z}
            legExtension={legExtensionEnd(rebar11Diameter)}
            radius={barRadius11}
            color="purple"
          />
        ),
      )}

      {/* A_s12 — dark orange vertical U-inserts wrapping the right end */}
      {z12Positions.map((z, i) => (
        <CornerHanger
          key={i}
          z={z}
          cornerX={length - cover12}
          bottomY={cutHeight + cover12}
          topY={h - cover12}
          legExtension={legExtensionEnd(rebar12Diameter)}
          radius={barRadius12}
          color="darkorange"
        />
      ))}

      {/* A_s13 — blue vertical U-inserts wrapping the right end */}
      {z13Positions.map((z, i) => (
        <CornerHanger
          key={i}
          z={z}
          cornerX={length - cover13}
          bottomY={cutHeight + cover13}
          topY={h - cover13}
          legExtension={legExtensionEnd(rebar13Diameter)}
          radius={barRadius13}
          color="blue"
        />
      ))}

      {/* A_s31 (zbrojenie uzupełniające, poziome case) — green horizontal U-inserts continuing
          the A_s11 stack */}
      {linkCase1 &&
        y31Positions.map((y, i) => (
          <EndHanger
            key={i}
            y={y}
            cornerX={corner31X}
            frontZ={front31Z}
            backZ={back31Z}
            legExtension={legExtensionEnd(rebar21Diameter)}
            radius={(rebar21Diameter / 2) * SCALE * REBAR_VISUAL_SCALE}
            color="green"
          />
        ))}

      {/* A_s31 (zbrojenie uzupełniające, pionowe case) — green stirrups within the dapped tip,
          from the cross-section change line toward the right end */}
      {linkCase2 &&
        x31Positions.map((x, i) => (
          <VerticalStirrupLoop
            key={i}
            x={x}
            centerY={stirrup31CenterY}
            rectHeightY={stirrup31RectHeightY}
            rectWidthZ={stirrup31RectWidthZ}
            radius={barRadius31}
            color="green"
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
  const printMode = usePrintMode()

  // Print mode forces the default (iso) view — the layout also resizes, so wait a beat for that
  // reflow before re-fitting the camera to the new canvas size.
  useEffect(() => {
    if (printMode) {
      const id = setTimeout(() => viewControllerRef.current?.fitView('iso'), 50)
      return () => clearTimeout(id)
    }
  }, [printMode])

  // The @media print rules only take effect once the browser actually starts printing (not when
  // print mode is toggled on-screen), which resizes the 3D pane again — re-fit once more so the
  // camera framing matches the printed page's canvas size, not the smaller on-screen preview size.
  useEffect(() => {
    const handleBeforePrint = () => {
      setTimeout(() => viewControllerRef.current?.fitView('iso'), 100)
    }
    window.addEventListener('beforeprint', handleBeforePrint)
    return () => window.removeEventListener('beforeprint', handleBeforePrint)
  }, [])

  const {
    hK,
    aV,
    rebar11Count,
    rebar11Diameter,
    rebar12Count,
    rebar12Diameter,
    rebar13Count,
    rebar13Diameter,
    rebar21Count,
    rebar21Diameter,
    rebar31Count,
    rebar31Diameter,
    rebar32Count,
    rebar32Diameter,
    rebar33Count,
    rebar33Diameter,
  } = useBeamDappedEnd()

  // Duplicates BeamScene's own A_s31 shape logic (Legend3D lives outside the Canvas, as plain HTML).
  const aVNum = Number(aV) || 0
  const hKNum = Number(hK) || 0
  const avHk = hKNum > 0 ? aVNum / hKNum : 0
  const linkCase1 = avHk <= 0.5
  const count31 = rebar21Count // manually picked, like the v1 selectors

  const bars11Count = Math.floor(rebar11Count / 2)
  const as23Count = Math.floor(rebar33Count / 2)

  const rawLegendItems: (Legend3DItem | false)[] = [
    bars11Count > 0 && { color: 'purple', label: `${bars11Count}⌀${rebar11Diameter}`, shape: 'u' as const },
    rebar12Count > 0 && {
      color: 'darkorange',
      label: `${rebar12Count}⌀${rebar12Diameter}`,
      shape: 'u' as const,
    },
    rebar13Count > 0 && { color: 'blue', label: `${rebar13Count}⌀${rebar13Diameter}`, shape: 'u' as const },
    rebar31Count > 0 && { color: 'red', label: `${rebar31Count}⌀${rebar31Diameter}`, shape: 'u' as const },
    rebar32Count > 0 && {
      color: 'turquoise',
      label: `${rebar32Count}⌀${rebar32Diameter}`,
      shape: 'u' as const,
    },
    as23Count > 0 && { color: 'yellow', label: `${as23Count}⌀${rebar33Diameter}`, shape: 'stirrup' as const },
    count31 > 0 && {
      color: 'green',
      label: `${count31}⌀${rebar21Diameter}`,
      shape: linkCase1 ? ('u' as const) : ('stirrup' as const),
    },
  ]
  const legendItems: Legend3DItem[] = rawLegendItems.filter(
    (item): item is Legend3DItem => item !== false,
  )

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

      <Legend3D items={legendItems} />
    </div>
  )
}

export default BeamDappedEndView
