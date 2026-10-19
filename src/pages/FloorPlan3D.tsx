import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons'
import { BUILDING, building, type Floor } from '../data/building'

/* 建筑尺寸（米） */
const W = BUILDING.width
const D = BUILDING.depth
const FH = BUILDING.floorHeight
const N = BUILDING.floorCount

/* ============ 楼层标签贴图 ============ */
function useLabelTexture(text: string, color: string) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 220
    c.height = 88
    const g = c.getContext('2d')
    if (g) {
      g.clearRect(0, 0, 220, 88)
      g.fillStyle = 'rgba(6,26,54,.82)'
      g.fillRect(30, 14, 160, 60)
      g.strokeStyle = color
      g.lineWidth = 3
      g.strokeRect(30, 14, 160, 60)
      g.fillStyle = '#dcefff'
      g.font = 'bold 40px system-ui, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, 110, 46)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.anisotropy = 4
    return tex
  }, [text, color])
}

/* ============ 窗带（实例化） ============ */
interface Slot {
  pos: [number, number, number]
  rotY: number
}
const SLOTS: Slot[] = (() => {
  const out: Slot[] = []
  const step = 2.6
  const y = FH * 0.56
  const colsX = Math.floor((W - 2.4) / step)
  const colsZ = Math.floor((D - 2.4) / step)
  for (let i = 0; i < colsX; i++) {
    const x = -((colsX - 1) * step) / 2 + i * step
    out.push({ pos: [x, y, D / 2 + 0.05], rotY: 0 })
    out.push({ pos: [x, y, -D / 2 - 0.05], rotY: Math.PI })
  }
  for (let i = 0; i < colsZ; i++) {
    const z = -((colsZ - 1) * step) / 2 + i * step
    out.push({ pos: [W / 2 + 0.05, y, z], rotY: Math.PI / 2 })
    out.push({ pos: [-W / 2 - 0.05, y, z], rotY: -Math.PI / 2 })
  }
  return out
})()

function splitForFloor(fi: number) {
  const lit: Slot[] = []
  const dim: Slot[] = []
  SLOTS.forEach((s, i) => {
    const v = (i * 7 + fi * 13 + ((i * i) % 11)) % 17
    if (v < 7) lit.push(s)
    else dim.push(s)
  })
  return { lit, dim }
}

function setInstances(mesh: THREE.InstancedMesh | null, list: Slot[]) {
  if (!mesh || !list.length) return
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const s = new THREE.Vector3(1, 1, 1)
  const p = new THREE.Vector3()
  list.forEach((slot, i) => {
    e.set(0, slot.rotY, 0)
    q.setFromEuler(e)
    p.set(slot.pos[0], slot.pos[1], slot.pos[2])
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
  })
  mesh.instanceMatrix.needsUpdate = true
}

/* ============ 单层楼体 ============ */
function FloorBlock({
  floor,
  hovered,
  selected,
  accent,
  onHover,
  onSelect,
}: {
  floor: Floor
  hovered: boolean
  selected: boolean
  accent: string
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
}) {
  const group = useRef<THREE.Group>(null)
  const litRef = useRef<THREE.InstancedMesh>(null)
  const dimRef = useRef<THREE.InstancedMesh>(null)
  const litMat = useRef<THREE.MeshStandardMaterial>(null)
  const dimMat = useRef<THREE.MeshStandardMaterial>(null)
  const slabMat = useRef<THREE.MeshStandardMaterial>(null)
  const shellMat = useRef<THREE.MeshBasicMaterial>(null)
  const baseY = (floor.index - 1) * FH
  const label = useLabelTexture(floor.label, selected ? accent : '#4fd8ff')

  const slabGeo = useMemo(() => new THREE.BoxGeometry(W + 0.9, 0.5, D + 0.9), [])
  const slabEdges = useMemo(() => new THREE.EdgesGeometry(slabGeo), [slabGeo])
  const topEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(W, FH, D)), [])
  const { lit, dim } = useMemo(() => splitForFloor(floor.index), [floor.index])

  useLayoutEffect(() => {
    setInstances(litRef.current, lit)
    setInstances(dimRef.current, dim)
  }, [lit, dim])

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 4.5)
    const g = group.current
    if (g) {
      const targetY = baseY + (hovered || selected ? 1.1 : 0)
      g.position.y += (targetY - g.position.y) * k
    }
    const glow = selected ? 2.4 : hovered ? 1.5 : 0.85
    if (litMat.current) litMat.current.emissiveIntensity += (glow - litMat.current.emissiveIntensity) * k
    if (dimMat.current) dimMat.current.emissiveIntensity += (glow * 0.42 - dimMat.current.emissiveIntensity) * k
    if (shellMat.current) {
      const t = selected ? 0.2 : hovered ? 0.12 : 0.028
      shellMat.current.opacity += (t - shellMat.current.opacity) * k
    }
  })

  return (
    <group ref={group} position={[0, baseY, 0]}>
      <mesh position={[0, -0.25, 0]} geometry={slabGeo}>
        <meshStandardMaterial ref={slabMat} color="#082036" metalness={0.5} roughness={0.62} transparent opacity={1} />
      </mesh>
      <lineSegments geometry={slabEdges} position={[0, -0.25, 0]}>
        <lineBasicMaterial color={selected ? accent : '#3fa9ff'} transparent opacity={selected ? 0.9 : 0.5} />
      </lineSegments>
      <mesh position={[0, FH * 0.5, 0]}>
        <boxGeometry args={[W - 0.9, FH - 0.5, D - 0.9]} />
        <meshStandardMaterial
          color="#0a2f52"
          emissive="#1f5f9e"
          emissiveIntensity={0.28}
          metalness={0.55}
          roughness={0.55}
          transparent
          opacity={0.94}
        />
      </mesh>
      <lineSegments geometry={topEdges} position={[0, FH * 0.5, 0]}>
        <lineBasicMaterial color={selected ? accent : '#5fc6ff'} transparent opacity={hovered || selected ? 0.85 : 0.28} />
      </lineSegments>
      <instancedMesh ref={litRef} args={[undefined, undefined, lit.length]}>
        <planeGeometry args={[2.0, FH * 0.64]} />
        <meshStandardMaterial
          ref={litMat}
          color="#2f7fb4"
          emissive="#5fd8ff"
          emissiveIntensity={0.42}
          metalness={0.4}
          roughness={0.24}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      <instancedMesh ref={dimRef} args={[undefined, undefined, dim.length]}>
        <planeGeometry args={[2.0, FH * 0.64]} />
        <meshStandardMaterial
          ref={dimMat}
          color="#123a5e"
          emissive="#2f7bd6"
          emissiveIntensity={0.18}
          metalness={0.6}
          roughness={0.36}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      <mesh
        position={[0, FH * 0.5, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(floor.index)
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(floor.index)
        }}
      >
        <boxGeometry args={[W, FH, D]} />
        <meshBasicMaterial ref={shellMat} color={selected ? accent : '#3fa9ff'} transparent opacity={0.028} depthWrite={false} />
      </mesh>
      <sprite position={[-W / 2 - 4.6, FH * 0.55, D / 2]} scale={[6, 3, 1]}>
        <spriteMaterial map={label} transparent depthWrite={false} />
      </sprite>
    </group>
  )
}

/* ============ 场景 ============ */
function BuildingScene({
  accent,
  hoveredFloor,
  selectedFloor,
  onHover,
  onSelect,
  autoRotate,
  resetKey,
}: {
  accent: string
  hoveredFloor: number | null
  selectedFloor: number | null
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
  autoRotate: boolean
  resetKey: number
}) {
  const { camera, gl } = useThree()
  const ctrl = useRef<OrbitControls | null>(null)
  const roofY = N * FH

  const cornerGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pts: number[] = []
    ;[-W / 2, W / 2].forEach((x) =>
      [-D / 2, D / 2].forEach((z) => {
        pts.push(x, 0, z, x, roofY, z)
      }),
    )
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [roofY])

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement)
    c.enableDamping = true
    c.dampingFactor = 0.08
    c.minDistance = 22
    c.maxDistance = 150
    c.minPolarAngle = 0.18
    c.maxPolarAngle = Math.PI / 2 - 0.05
    c.autoRotateSpeed = 0.42
    c.target.set(0, FH * 2.6, 0)
    c.update()
    ctrl.current = c
    return () => c.dispose()
  }, [camera, gl])

  useEffect(() => {
    if (ctrl.current) ctrl.current.autoRotate = autoRotate
  }, [autoRotate])

  useEffect(() => {
    camera.position.set(54, 33, 62)
    if (ctrl.current) {
      ctrl.current.target.set(0, FH * 2.6, 0)
      ctrl.current.update()
    }
  }, [resetKey, camera])

  useFrame(() => ctrl.current?.update())

  return (
    <>
      <fog attach="fog" args={['#061a38', 150, 340]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[48, 84, 42]} intensity={1.3} color="#e6f4ff" />
      <directionalLight position={[-62, 38, -44]} intensity={0.7} color="#4fa6ff" />
      <pointLight position={[0, roofY + 16, 0]} intensity={90} color="#5fd8ff" distance={90} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[460, 460]} />
        <meshStandardMaterial color="#061a38" metalness={0.3} roughness={0.9} />
      </mesh>
      <gridHelper args={[300, 60, '#1f4f86', '#0e2c4c']} position={[0, 0, 0]} />

      {building.floors.map((f) => (
        <FloorBlock
          key={f.index}
          floor={f}
          hovered={hoveredFloor === f.index}
          selected={selectedFloor === f.index}
          accent={accent}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      {/* 四角竖向轮廓 */}
      <lineSegments geometry={cornerGeo}>
        <lineBasicMaterial color={accent} transparent opacity={0.42} />
      </lineSegments>

      <group position={[0, roofY + 0.2, 0]}>
        <mesh>
          <boxGeometry args={[W + 0.4, 0.35, D + 0.4]} />
          <meshStandardMaterial color="#07203a" metalness={0.5} roughness={0.7} />
        </mesh>
        <mesh position={[-2, 1.05, -1]}>
          <boxGeometry args={[8.4, 1.9, 5.6]} />
          <meshStandardMaterial color="#0b3050" metalness={0.5} roughness={0.6} emissive="#2f7bd6" emissiveIntensity={0.16} />
        </mesh>
        <mesh position={[W / 2 - 5, 0.7, -D / 2 + 4]}>
          <boxGeometry args={[3.2, 1.4, 3.2]} />
          <meshStandardMaterial color="#0b3050" metalness={0.5} roughness={0.6} emissive="#2f7bd6" emissiveIntensity={0.16} />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[34, 44, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

/* ============ 对外组件 ============ */
export default function FloorPlan3D({
  accent = '#3b5bff',
  selectedFloor,
  onSelectFloor,
}: {
  accent?: string
  selectedFloor: number | null
  onSelectFloor: (i: number | null) => void
}) {
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="fp3d-canvas">
      <Canvas dpr={[1, 2]} camera={{ position: [54, 33, 62], fov: 36, near: 0.5, far: 800 }} gl={{ antialias: true, alpha: true }}>
        <BuildingScene
          accent={accent}
          hoveredFloor={hoveredFloor}
          selectedFloor={selectedFloor}
          onHover={setHoveredFloor}
          onSelect={onSelectFloor}
          autoRotate={autoRotate}
          resetKey={resetKey}
        />
      </Canvas>

      {selectedFloor !== null && (
        <div className="fp3d-floortag">
          已选楼层 <b>{selectedFloor}F</b>
          <button type="button" className="fp3d-floortag-x" onClick={() => onSelectFloor(null)} aria-label="取消选择">
            ×
          </button>
        </div>
      )}

      <div className="fp3d-overlay">
        <button
          type="button"
          className={`fp3d-btn${autoRotate ? ' is-on' : ''}`}
          onClick={() => setAutoRotate((v) => !v)}
          aria-label="自动旋转"
        >
          <SyncOutlined /> 旋转
        </button>
        <button type="button" className="fp3d-btn" onClick={() => setResetKey((k) => k + 1)} aria-label="复位视角">
          <ReloadOutlined /> 复位
        </button>
      </div>

      <div className="fp3d-hint">
        <span>拖拽旋转</span>
        <span>滚轮缩放</span>
        <span>点击楼层查看详情</span>
      </div>
    </div>
  )
}
