import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'
import { Box3, DoubleSide, Vector3 } from 'three'
import type { Group, OrthographicCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useCorbel } from './CorbelContext'
import { hasCorbelInputError } from './validation'
import Legend3D, { type Legend3DItem } from '../../components/Legend3D'
import { usePrintMode } from '../../PrintModeContext'

const SCALE = 0.01 // 1 three.js unit = 100 mm
const MIN_MM = 1
const COVER_MM = 25
const PURPLE_VERTICAL_COVER_MM = 45 // A_s11 bars' top/bottom cover
const PURPLE_SIDE_COVER_MM = 80 // A_s11 bars' cover from the corbel's sides, in plan
const BEND_RADIUS_FACTOR = 2 // bend radius = 2 * diameter, applied to every bar shown in the view
const BLUE_EDGE_MARGIN_MM = 80 // first/last blue stirrup sit 8cm from the corbel's top/bottom edge
const BLUE_NO_ORANGE_TOP_MARGIN_MM = 60 // when no orange stirrups are present, the first blue stirrup starts 6cm from the top instead
const STIRRUP_COVER_MM = 30 // A_s12/A_sw,h stirrup cover on all sides
const ORANGE_TOP_MARGIN_MM = 45 // first orange stirrup sits 4.5cm from the corbel's top edge
const REBAR_VISUAL_SCALE = 1.6 // true-to-scale bar diameters would be nearly invisible
const MAX_STIRRUPS = 60
const PHASE_MULTIPLIERS = [1, 2, 4] // mirrors RebarSelector/SelektorV3's x1/x2/x4 toggle phases
const COLUMN_EXTRA_MM = 100 // column cross-section is b + 100mm square
const COLUMN_LENGTH_MM = 2000
const ANCHOR_FACTOR = 40 // main bar anchorage length into the column = 40 * diameter

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

/**
 * A closed rectangular stirrup shape, flat in its local X-Z plane (local Y=0 throughout), built
 * from 4 straight segments joined by 4×⌀ rounded fillets. Callers position/orient it via an
 * enclosing <group>: left as-is it lies flat (horizontal); rotated 90° about Z it stands up
 * (vertical), since a Z-rotation maps the local X (primary) axis onto global Y.
 */
function LoopShape({ halfPrimary, halfZ, radius, color }: LoopShapeProps) {
  const R = Math.max(
    Math.min(radius * BEND_RADIUS_FACTOR * 2, halfPrimary / 2, halfZ / 2),
    radius * 1.01,
  )
  const primaryLen = Math.max(2 * (halfPrimary - R), 0)
  const widthLen = Math.max(2 * (halfZ - R), 0)
  const torusArgs: [number, number, number, number, number] = [R, radius, 8, 16, Math.PI / 2]

  // Each corner is a quarter-torus fillet; rotZ picks which quadrant of the loop it fills.
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

interface HorizontalStirrupLoopProps {
  y: number
  centerX: number
  rectLengthX: number
  rectWidthZ: number
  radius: number
  color: string
}

/** A closed rectangular stirrup lying flat in the X-Z (horizontal) plane. */
function HorizontalStirrupLoop({
  y,
  centerX,
  rectLengthX,
  rectWidthZ,
  radius,
  color,
}: HorizontalStirrupLoopProps) {
  return (
    <group position={[centerX, y, 0]}>
      <LoopShape halfPrimary={rectLengthX / 2} halfZ={rectWidthZ / 2} radius={radius} color={color} />
    </group>
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

/** A closed rectangular stirrup standing in the Y-Z (vertical) plane at a fixed X along the nib. */
function VerticalStirrupLoop({
  x,
  centerY,
  rectHeightY,
  rectWidthZ,
  radius,
  color,
}: VerticalStirrupLoopProps) {
  return (
    <group position={[x, centerY, 0]} rotation={[0, 0, Math.PI / 2]}>
      <LoopShape halfPrimary={rectHeightY / 2} halfZ={rectWidthZ / 2} radius={radius} color={color} />
    </group>
  )
}

interface AnchorBarProps {
  z: number
  columnAxisX: number
  columnTrueAxisX: number
  tipX: number
  topY: number
  bottomY: number
  anchorFreeY: number
  radius: number
  color: string
}

/**
 * Main tie bar (A_s11), bent into 4 straight segments joined by 90° fillets of radius 5×⌀:
 * anchored down into the column, along the corbel's top edge, down the corbel's outer face, and
 * back along the bottom — this last segment reaches all the way to the column's own axis, not
 * just the touching-point with the stirrups.
 */
function AnchorBar({
  z,
  columnAxisX,
  columnTrueAxisX,
  tipX,
  topY,
  bottomY,
  anchorFreeY,
  radius,
  color,
}: AnchorBarProps) {
  const spanX = tipX - columnAxisX
  const bottomSpanX = tipX - columnTrueAxisX
  const heightSpan = topY - bottomY

  const bendRadius = Math.max(
    Math.min(radius * BEND_RADIUS_FACTOR * 2, heightSpan / 3, spanX / 3, bottomSpanX / 3),
    radius * 1.01,
  )
  const R = bendRadius

  // Straight segments are shortened by the bend radius at each fillet they meet.
  const seg1Top = topY - R
  const seg2Start = columnAxisX + R
  const seg2End = tipX - R
  const seg3Top = topY - R
  const seg3Bottom = bottomY + R
  const seg4Start = tipX - R

  const seg1Len = Math.max(seg1Top - anchorFreeY, 0)
  const seg2Len = Math.max(seg2End - seg2Start, 0)
  const seg3Len = Math.max(seg3Top - seg3Bottom, 0)
  const seg4Len = Math.max(seg4Start - columnTrueAxisX, 0)

  const torusArgs: [number, number, number, number, number] = [R, radius, 12, 16, Math.PI / 2]

  return (
    <group position={[0, 0, z]}>
      {/* segment 1: vertical anchorage tail into the column */}
      <mesh position={[columnAxisX, (anchorFreeY + seg1Top) / 2, 0]}>
        <cylinderGeometry args={[radius, radius, seg1Len, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillet: tail -> top edge */}
      <mesh position={[columnAxisX + R, topY - R, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* segment 2: along the corbel's top edge */}
      <mesh position={[(seg2Start + seg2End) / 2, topY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, seg2Len, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillet: top edge -> outer face */}
      <mesh position={[tipX - R, topY - R, 0]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* segment 3: down the corbel's outer face */}
      <mesh position={[tipX, (seg3Top + seg3Bottom) / 2, 0]}>
        <cylinderGeometry args={[radius, radius, seg3Len, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillet: outer face -> bottom */}
      <mesh position={[tipX - R, bottomY + R, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* segment 4: back along the bottom to the column's own axis */}
      <mesh position={[(seg4Start + columnTrueAxisX) / 2, bottomY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, seg4Len, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

interface CapTieBarProps {
  farX: number
  tipX: number
  frontZ: number
  backZ: number
  topY: number
  bottomY: number
  radius: number
  /** Bend radius (already scaled) — for A_s11 at x2 this is 8×⌀. */
  bendRadius: number
  color: string
}

/**
 * A_s11 at x2 — single bar, bent into 5 straight segments: two vertical anchorage tails at the
 * column's far face (opposite the corbel), each bending 90° into a horizontal run along the
 * corbel's top edge (at the front/back edges), joined by a straight bridge across the width at
 * the corbel's tip — one continuous bar, closed at the tip, open (anchored down) at the column.
 */
function CapTieBar({
  farX,
  tipX,
  frontZ,
  backZ,
  topY,
  bottomY,
  radius,
  bendRadius,
  color,
}: CapTieBarProps) {
  const xSpan = tipX - farX
  const zSpan = frontZ - backZ
  const ySpan = topY - bottomY
  const R = Math.max(Math.min(bendRadius, xSpan / 4, zSpan / 4, ySpan / 3), radius * 1.01)
  const torusArgs: [number, number, number, number, number] = [R, radius, 8, 16, Math.PI / 2]

  const vertTop = topY - R
  const vertLen = Math.max(vertTop - bottomY, 0)
  const horizStart = farX + R
  const horizEnd = tipX - R
  const horizLen = Math.max(horizEnd - horizStart, 0)
  const bridgeStart = backZ + R
  const bridgeEnd = frontZ - R
  const bridgeLen = Math.max(bridgeEnd - bridgeStart, 0)

  return (
    <>
      {/* vertical tails, at the column's far face */}
      <mesh position={[farX, (bottomY + vertTop) / 2, frontZ]}>
        <cylinderGeometry args={[radius, radius, vertLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[farX, (bottomY + vertTop) / 2, backZ]}>
        <cylinderGeometry args={[radius, radius, vertLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillets: vertical tail -> horizontal leg */}
      <mesh position={[farX + R, vertTop, frontZ]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[farX + R, vertTop, backZ]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* horizontal legs, along the corbel's axis at the front/back edges */}
      <mesh position={[(horizStart + horizEnd) / 2, topY, frontZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, horizLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[(horizStart + horizEnd) / 2, topY, backZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, horizLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* fillets: horizontal leg -> bridge, at the corbel's tip */}
      <mesh position={[tipX - R, topY, frontZ - R]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[tipX - R, topY, backZ + R]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
        <torusGeometry args={torusArgs} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* bridge, connecting the two planes along the corbel's top edge at the tip */}
      <mesh position={[tipX, topY, (bridgeStart + bridgeEnd) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, bridgeLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  )
}

export interface CorbelSceneInputs {
  fVSd: string
  aF: string
  aH: string
  hDim: string
  bDim: string
  concreteClass: string
  steelGrade: string
  rebar11Count: number
  rebar11Diameter: number
  rebar11Phase: number
  rebar12Count: number
  rebar12Diameter: number
  rebar12Phase: number
  rebarSwCount: number
  rebarSwDiameter: number
  rebarSwPhase: number
  rebar31Count: number
  rebar31Diameter: number
  rebar31Phase: number
}

function CorbelScene({ inputs }: { inputs: CorbelSceneInputs }) {
  const {
    aF,
    hDim,
    bDim,
    rebar11Count,
    rebar11Diameter,
    rebar11Phase,
    rebar12Count,
    rebar12Diameter,
    rebar12Phase,
    rebarSwCount,
    rebarSwDiameter,
    rebarSwPhase,
    rebar31Count,
    rebar31Diameter,
    rebar31Phase,
  } = inputs

  const h = Math.max(Number(hDim) || 0, MIN_MM) * SCALE
  const bMm = Math.max(Number(bDim) || 0, MIN_MM)
  const b = bMm * SCALE
  const aFMm = Math.max(Number(aF) || 0, MIN_MM)
  const cover = COVER_MM * SCALE
  const purpleVerticalCover = PURPLE_VERTICAL_COVER_MM * SCALE
  const purpleSideCover = PURPLE_SIDE_COVER_MM * SCALE

  const nibLength = 2 * aFMm * SCALE
  const columnSize = (bMm + COLUMN_EXTRA_MM) * SCALE
  const columnLength = COLUMN_LENGTH_MM * SCALE
  const columnCenterY = h / 2

  // rebar12Count/rebarSwCount are cut *legs* (2-cięte, 4-cięte, ...); the number of loops drawn is
  // the selected count divided by the current toggle phase's multiplier.
  const rebar12Multiplier = PHASE_MULTIPLIERS[rebar12Phase] ?? 1
  const orangeCount = Number.isFinite(rebar12Count)
    ? Math.min(Math.max(Math.floor(rebar12Count / rebar12Multiplier), 0), MAX_STIRRUPS)
    : 0
  const rebarSwMultiplier = PHASE_MULTIPLIERS[rebarSwPhase] ?? 1
  const swCount = Number.isFinite(rebarSwCount)
    ? Math.min(Math.max(Math.floor(rebarSwCount / rebarSwMultiplier), 0), MAX_STIRRUPS)
    : 0

  const barRadius11 = (rebar11Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  const barRadius12 = (rebar12Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  const barRadiusSw = (rebarSwDiameter / 2) * SCALE * REBAR_VISUAL_SCALE

  const topY = Math.max(h - purpleVerticalCover, purpleVerticalCover)
  const bottomY = purpleVerticalCover
  const stirrupCover = STIRRUP_COVER_MM * SCALE

  // A_s12/A_sw,h stirrups: horizontal loops in plan, reaching almost across the full column depth
  // (to the opposite face, minus cover) out to near the corbel tip, with a 3cm cover on all sides.
  const columnFarFaceX = -columnSize
  const stirrupNearX = columnFarFaceX + stirrupCover
  const stirrupFarX = Math.max(nibLength - stirrupCover, stirrupNearX + stirrupCover)
  const stirrupCenterX = (stirrupNearX + stirrupFarX) / 2
  const stirrupRectLengthX = stirrupFarX - stirrupNearX
  const stirrupRectWidthZ = Math.max(b - 2 * stirrupCover, stirrupCover)
  const orangeTopMargin = ORANGE_TOP_MARGIN_MM * SCALE
  const orangeStartY = Math.max(h - orangeTopMargin, cover)

  // A_s11 anchor bars: pulled inside the corbel so they sit just inside (touching) the orange
  // stirrup legs, both at the column-embedded end and at the corbel's outer face.
  const touchOffset = barRadius11 + barRadius12
  const columnAxisX = Math.min(stirrupNearX + touchOffset, stirrupFarX - stirrupCover)
  const tipX = Math.max(stirrupFarX - touchOffset, columnAxisX + stirrupCover)
  const columnTrueAxisX = -columnSize / 2 // the bar's last segment reaches all the way to the column's own axis
  const anchorLen = Math.max(ANCHOR_FACTOR * rebar11Diameter, MIN_MM) * SCALE
  const anchorFreeY = topY - anchorLen

  const halfSpanZ = Math.max(b / 2 - purpleSideCover, 0)
  const barZPositions = evenlySpaced(rebar11Count, -halfSpanZ, halfSpanZ)

  // CapTieBar's (x2) cover, 50mm+0.5⌀ on all sides (front/back, top, and the column's far face).
  const capTieCover = (50 + 0.5 * rebar11Diameter) * SCALE
  const capTieHalfSpanZ = Math.max(b / 2 - capTieCover, 0)
  const capTieTopY = Math.max(h - capTieCover, 0)
  const capTieFarX = columnFarFaceX + capTieCover

  // Orange stirrups stack tightly one above another at the corbel's top edge.
  const orangeSpacing = Math.max(barRadius12 * 2.4, MIN_MM * SCALE)
  const orangeYPositions = Array.from({ length: orangeCount }, (_, i) =>
    Math.max(orangeStartY - i * orangeSpacing, cover),
  )

  // Blue stirrups are spread evenly across the corbel's height: first 8cm from the top edge
  // (or 6cm when there are no orange stirrups to yield space to), last 8cm from the bottom edge.
  // An extra 10mm of top cover is added whenever A_s12 is present.
  const swEdgeMargin = BLUE_EDGE_MARGIN_MM * SCALE
  const swTopMargin =
    ((orangeCount > 0 ? BLUE_EDGE_MARGIN_MM : BLUE_NO_ORANGE_TOP_MARGIN_MM) +
      (rebar12Count > 0 ? 10 : 0)) *
    SCALE
  const swRangeBottom = Math.min(swEdgeMargin, h / 2)
  const swRangeTop = Math.max(h - swTopMargin, swRangeBottom)
  const swYPositions = evenlySpaced(swCount, swRangeBottom, swRangeTop)

  // A_s31 — green vertical stirrups: 3cm top/bottom cover, sides pulled in by 3cm plus the
  // horizontal stirrups' own bar thickness so they nest just inside them. Spread from the column
  // face (x=0) out to a_F. Position count is the selected count divided by the toggle phase's
  // multiplier (matching A_s12/A_s21's convention).
  const rebar31Multiplier = PHASE_MULTIPLIERS[rebar31Phase] ?? 1
  const verticalCount = Number.isFinite(rebar31Count)
    ? Math.min(Math.max(Math.floor(rebar31Count / rebar31Multiplier), 0), MAX_STIRRUPS)
    : 0
  const barRadius31 = (rebar31Diameter / 2) * SCALE * REBAR_VISUAL_SCALE
  // Front/back cover: 25mm + half the bar's own diameter + 8mm.
  const verticalSideCover = (25 + 0.5 * rebar31Diameter + 8) * SCALE
  const verticalRectHeightY = Math.max(h - 2 * stirrupCover, stirrupCover)
  const verticalRectWidthZ = Math.max(b - 2 * verticalSideCover, verticalSideCover)
  const verticalXPositions = evenlySpaced(verticalCount, 0, aFMm * SCALE)

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} />

      {/* Column */}
      <mesh position={[-columnSize / 2, columnCenterY, 0]}>
        <boxGeometry args={[columnSize, columnLength, columnSize]} />
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

      {/* Corbel nib */}
      <mesh position={[nibLength / 2, h / 2, 0]}>
        <boxGeometry args={[nibLength, h, b]} />
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

      {/* A_s11 — main tie bars, anchored into the column, nested inside the stirrups.
          x1: full loop to the corbel's bottom, one per bar position. x2: a single bar, regardless
          of the selected count — two vertical tails at the column's far face bending into
          horizontal runs at the corbel's front/back edges, joined by a bridge at the tip. x4: not
          drawn. */}
      {rebar11Phase === 1 ? (
        <CapTieBar
          farX={capTieFarX}
          tipX={tipX}
          frontZ={capTieHalfSpanZ}
          backZ={-capTieHalfSpanZ}
          topY={capTieTopY}
          bottomY={capTieTopY - anchorLen}
          radius={barRadius11}
          bendRadius={8.5 * rebar11Diameter * SCALE}
          color="purple"
        />
      ) : (
        rebar11Phase === 0 &&
        barZPositions.map((z, i) => (
          <AnchorBar
            key={i}
            z={z}
            columnAxisX={columnAxisX}
            columnTrueAxisX={columnTrueAxisX}
            tipX={tipX}
            topY={topY}
            bottomY={bottomY}
            anchorFreeY={anchorFreeY}
            radius={barRadius11}
            color="purple"
          />
        ))
      )}

      {/* A_s12 — orange horizontal stirrup loops, top of the corbel. At x4 ("strzemię czterocięte"),
          a second, narrower loop nests inside the normal one: same cover/length as the outer loop's
          short legs, but its long legs split the space between the outer loop's long legs into 3
          equal parts. */}
      {orangeYPositions.map((y, i) => (
        <group key={i}>
          <HorizontalStirrupLoop
            y={y}
            centerX={stirrupCenterX}
            rectLengthX={stirrupRectLengthX}
            rectWidthZ={stirrupRectWidthZ}
            radius={barRadius12}
            color="darkorange"
          />
          {rebar12Phase === 2 && (
            <HorizontalStirrupLoop
              y={y}
              centerX={stirrupCenterX}
              rectLengthX={stirrupRectLengthX}
              rectWidthZ={stirrupRectWidthZ / 3}
              radius={barRadius12}
              color="darkorange"
            />
          )}
        </group>
      ))}

      {/* A_sw,h — blue horizontal stirrup loops, continuing below the orange ones. At x4
          ("strzemię czterocięte"), a second, narrower loop nests inside the normal one. */}
      {swYPositions.map((y, i) => (
        <group key={i}>
          <HorizontalStirrupLoop
            y={y}
            centerX={stirrupCenterX}
            rectLengthX={stirrupRectLengthX}
            rectWidthZ={stirrupRectWidthZ}
            radius={barRadiusSw}
            color="blue"
          />
          {rebarSwPhase === 2 && (
            <HorizontalStirrupLoop
              y={y}
              centerX={stirrupCenterX}
              rectLengthX={stirrupRectLengthX}
              rectWidthZ={stirrupRectWidthZ / 3}
              radius={barRadiusSw}
              color="blue"
            />
          )}
        </group>
      ))}

      {/* A_s31 — green vertical stirrups, spread from the column face out to a_F. At x4
          ("strzemię czterocięte"), a second, narrower loop nests inside the normal one. */}
      {verticalXPositions.map((x, i) => (
        <group key={i}>
          <VerticalStirrupLoop
            x={x}
            centerY={h / 2}
            rectHeightY={verticalRectHeightY}
            rectWidthZ={verticalRectWidthZ}
            radius={barRadius31}
            color="green"
          />
          {rebar31Phase === 2 && (
            <VerticalStirrupLoop
              x={x}
              centerY={h / 2}
              rectHeightY={verticalRectHeightY}
              rectWidthZ={verticalRectWidthZ / 3}
              radius={barRadius31}
              color="green"
            />
          )}
        </group>
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

export interface ViewControllerHandle {
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

function Corbel3DView() {
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
    rebar11Phase,
    rebar12Count,
    rebar12Diameter,
    rebar12Phase,
    rebarSwCount,
    rebarSwDiameter,
    rebarSwPhase,
    rebar31Count,
    rebar31Diameter,
    rebar31Phase,
  } = useCorbel()
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

  // Belt-and-braces re-fit right before the print snapshot is taken, in case anything (e.g. a
  // scrollbar disappearing, or App.tsx's page-fit scaling pass) nudged the canvas's pixel size
  // between the printMode effect above and the actual print.
  useEffect(() => {
    const handleBeforePrint = () => {
      viewControllerRef.current?.fitView('iso')
    }
    window.addEventListener('beforeprint', handleBeforePrint)
    return () => window.removeEventListener('beforeprint', handleBeforePrint)
  }, [])

  const hasError = hasCorbelInputError({ fVSd, aF, aH, hDim, bDim, concreteClass })
  const liveInputs: CorbelSceneInputs = {
    fVSd,
    aF,
    aH,
    hDim,
    bDim,
    concreteClass,
    steelGrade,
    rebar11Count,
    rebar11Diameter,
    rebar11Phase,
    rebar12Count,
    rebar12Diameter,
    rebar12Phase,
    rebarSwCount,
    rebarSwDiameter,
    rebarSwPhase,
    rebar31Count,
    rebar31Diameter,
    rebar31Phase,
  }

  // Freeze the 3D view on the last valid input set while the left/center panels show an error.
  const [frozenInputs, setFrozenInputs] = useState<CorbelSceneInputs>(liveInputs)
  useEffect(() => {
    if (!hasError) {
      setFrozenInputs(liveInputs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasError,
    fVSd,
    aF,
    aH,
    hDim,
    bDim,
    concreteClass,
    steelGrade,
    rebar11Count,
    rebar11Diameter,
    rebar11Phase,
    rebar12Count,
    rebar12Diameter,
    rebar12Phase,
    rebarSwCount,
    rebarSwDiameter,
    rebarSwPhase,
    rebar31Count,
    rebar31Diameter,
    rebar31Phase,
  ])
  const effectiveInputs = hasError ? frozenInputs : liveInputs

  const rawLegendItems: (Legend3DItem | false)[] = [
    effectiveInputs.rebar11Count > 0 && {
      color: 'purple',
      label: `${effectiveInputs.rebar11Count}⌀${effectiveInputs.rebar11Diameter}`,
      shape: 'bar' as const,
    },
    effectiveInputs.rebar12Count > 0 && {
      color: 'darkorange',
      label: `${effectiveInputs.rebar12Count}⌀${effectiveInputs.rebar12Diameter}`,
      shape: effectiveInputs.rebar12Phase === 2 ? ('fourCutStirrup' as const) : ('stirrup' as const),
    },
    effectiveInputs.rebarSwCount > 0 && {
      color: 'blue',
      // rebarSwCount is cut *legs*; each closed loop (physical bar) forms 2 legs.
      label: `${Math.floor(effectiveInputs.rebarSwCount / 2)}⌀${effectiveInputs.rebarSwDiameter}`,
      shape: effectiveInputs.rebarSwPhase === 2 ? ('fourCutStirrup' as const) : ('stirrup' as const),
    },
    effectiveInputs.rebar31Count > 0 && {
      color: 'green',
      label: `${effectiveInputs.rebar31Count}⌀${effectiveInputs.rebar31Diameter}`,
      shape: effectiveInputs.rebar31Phase === 2 ? ('fourCutStirrup' as const) : ('stirrup' as const),
    },
  ]
  const legendItems: Legend3DItem[] = rawLegendItems.filter(
    (item): item is Legend3DItem => item !== false,
  )

  const applyView = (preset: ViewPreset) => viewControllerRef.current?.fitView(preset)

  return (
    <div className="relative h-full w-full overflow-hidden">
      {hasError && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow-lg">
            Popraw dane wejściowe
          </span>
        </div>
      )}

      {!printMode && (
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
      )}

      <Canvas orthographic dpr={[1, 2]} camera={{ position: [8, 8, 8], zoom: 50, near: 0.1, far: 1000 }}>
        <group ref={sceneRef}>
          <CorbelScene inputs={effectiveInputs} />
        </group>
        <ViewController ref={viewControllerRef} controlsRef={controlsRef} sceneRef={sceneRef} />
        <InitialFit viewControllerRef={viewControllerRef} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          enableRotate={!printMode}
          enablePan={!printMode}
        />
      </Canvas>

      <Legend3D items={legendItems} />
    </div>
  )
}

export default Corbel3DView
