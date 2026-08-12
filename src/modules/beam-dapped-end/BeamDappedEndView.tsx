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

const SCALE = 0.01 // 1 three.js unit = 100 mm
const MIN_MM = 1
const BEAM_LENGTH_MM = 2000 // fixed 2m beam, independent of l_k/geometry inputs

function BeamScene() {
  const { hDim, hK, lK, bDim } = useBeamDappedEnd()

  const h = Math.max(Number(hDim) || 0, MIN_MM) * SCALE
  const hKRaw = Math.max(Number(hK) || 0, MIN_MM)
  const hK_ = Math.min(hKRaw, Number(hDim) || hKRaw) * SCALE
  const b = Math.max(Number(bDim) || 0, MIN_MM) * SCALE
  const length = BEAM_LENGTH_MM * SCALE
  const lKRaw = Math.max(Number(lK) || 0, MIN_MM)
  const lK_ = Math.min(lKRaw, BEAM_LENGTH_MM) * SCALE

  const mainLength = Math.max(length - lK_, MIN_MM * SCALE)
  const cutHeight = Math.max(h - hK_, 0)

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
    </div>
  )
}

export default BeamDappedEndView
