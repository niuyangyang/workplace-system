import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  AimOutlined,
  BankOutlined,
  ExpandOutlined,
  LeftOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  ALL_DESKS,
  BUILDING,
  DEPT_DIST,
  DESK_BY_ID,
  FLOOR_STATS,
  PLAN_H,
  PLAN_W,
  TOTAL_AREA,
  TOTAL_DESK,
  TOTAL_OCCUPIED,
  building,
  deskHistory,
  neighborsOf,
  type Desk,
  type Floor,
  type Room,
  type Staff,
} from '../data/building'
import './buildingScreen.css'

const W = BUILDING.width
const D = BUILDING.depth
const FH = BUILDING.floorHeight
const N = BUILDING.floorCount
const WALL_H = 1.15

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const now = new Date()
const TODAY = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${WEEKDAYS[now.getDay()]}`

const STATUS_COLOR: Record<Desk['status'], string> = {
  占用: '#4fd8ff',
  空闲: '#5d7ea6',
  预留: '#ffd24a',
}

const DEPT_COLORS = ['#4fd8ff', '#6fa8ff', '#ffd24a', '#35e0b0', '#ff9d2e', '#b58cff']

function deptColor(staff?: Staff) {
  if (!staff) return '#5d7ea6'
  const i = DEPT_DIST.findIndex((d) => d.dept === staff.dept)
  return DEPT_COLORS[(i < 0 ? 0 : i) % DEPT_COLORS.length]
}

/* 平面图坐标(0..100 × 0..58) → 楼层世界坐标(米) */
const planToWorld = (px: number, py: number): [number, number] => [
  (px / PLAN_W) * W - W / 2,
  (py / PLAN_H) * D - D / 2,
]
const roomRect = (r: Room) => {
  const [x0, z0] = planToWorld(r.x, r.y)
  const [x1, z1] = planToWorld(r.x + r.w, r.y + r.h)
  return { x0, x1, z0, z1 }
}
const roomDoor = (r: Room): [number, number] => planToWorld(r.x + r.w / 2, r.y + r.h)
const roomCenter = (r: Room): [number, number] => planToWorld(r.x + r.w / 2, r.y + r.h / 2)

/* ============ 标签贴图 ============ */
function useLabelTexture(text: string, opts?: { small?: boolean; color?: string }) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 220
    c.height = 88
    const g = c.getContext('2d')
    if (g) {
      g.clearRect(0, 0, 220, 88)
      if (!opts?.small) {
        g.fillStyle = 'rgba(6,26,54,.82)'
        g.fillRect(30, 14, 160, 60)
        g.strokeStyle = opts?.color ?? '#4fd8ff'
        g.lineWidth = 3
        g.strokeRect(30, 14, 160, 60)
      }
      g.fillStyle = opts?.color ?? '#dcefff'
      g.font = `bold ${opts?.small ? 30 : 40}px system-ui, sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, 110, 46)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.anisotropy = 4
    return tex
  }, [text, opts?.small, opts?.color])
}

/* ============ 一级：楼栋三维 ============ */
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


function FloorBlock({
  floor,
  hovered,
  onHover,
  onEnter,
}: {
  floor: Floor
  hovered: boolean
  onHover: (i: number | null) => void
  onEnter: (i: number) => void
}) {
  const group = useRef<THREE.Group>(null)
  const litRef = useRef<THREE.InstancedMesh>(null)
  const dimRef = useRef<THREE.InstancedMesh>(null)
  const litMat = useRef<THREE.MeshStandardMaterial>(null)
  const dimMat = useRef<THREE.MeshStandardMaterial>(null)
  const slabMat = useRef<THREE.MeshStandardMaterial>(null)
  const shellMat = useRef<THREE.MeshBasicMaterial>(null)
  const baseY = (floor.index - 1) * FH
  const label = useLabelTexture(floor.label)

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
      const targetY = baseY + (hovered ? 1.1 : 0)
      g.position.y += (targetY - g.position.y) * k
    }
    const glow = hovered ? 1.5 : 0.85
    if (litMat.current) litMat.current.emissiveIntensity += (glow - litMat.current.emissiveIntensity) * k
    if (dimMat.current) dimMat.current.emissiveIntensity += (glow * 0.42 - dimMat.current.emissiveIntensity) * k
    if (shellMat.current) {
      const t = hovered ? 0.1 : 0.028
      shellMat.current.opacity += (t - shellMat.current.opacity) * k
    }
  })

  return (
    <group ref={group} position={[0, baseY, 0]}>
      <mesh position={[0, -0.25, 0]} geometry={slabGeo}>
        <meshStandardMaterial ref={slabMat} color="#082036" metalness={0.5} roughness={0.62} transparent opacity={1} />
      </mesh>
      <lineSegments geometry={slabEdges} position={[0, -0.25, 0]}>
        <lineBasicMaterial color="#3fa9ff" transparent opacity={0.5} />
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
        <lineBasicMaterial color="#5fc6ff" transparent opacity={hovered ? 0.75 : 0.28} />
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
          onEnter(floor.index)
        }}
      >
        <boxGeometry args={[W, FH, D]} />
        <meshBasicMaterial ref={shellMat} color="#3fa9ff" transparent opacity={0.028} depthWrite={false} />
      </mesh>
      <sprite position={[-W / 2 - 4.6, FH * 0.55, D / 2]} scale={[6, 3, 1]}>
        <spriteMaterial map={label} transparent depthWrite={false} />
      </sprite>
    </group>
  )
}

function BuildingScene({
  hoveredFloor,
  onHover,
  onEnter,
  autoRotate,
  resetKey,
}: {
  hoveredFloor: number | null
  onHover: (i: number | null) => void
  onEnter: (i: number) => void
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
    c.minDistance = 20
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
          onHover={onHover}
          onEnter={onEnter}
        />
      ))}

      {/* 四角竖向轮廓 */}
      <lineSegments geometry={cornerGeo}>
        <lineBasicMaterial color="#5fd8ff" transparent opacity={0.42} />
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
        <meshBasicMaterial color="#2f7bd6" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

/* ============ 二级：楼层内部三维 ============ */
function FloorControls({
  fly,
}: {
  fly: React.MutableRefObject<((p: [number, number, number], t: [number, number, number]) => void) | null>
}) {
  const { camera, gl } = useThree()
  const ctrl = useRef<OrbitControls | null>(null)
  const anim = useRef({ active: false, p: new THREE.Vector3(), t: new THREE.Vector3() })

  fly.current = (p, t) => {
    anim.current = { active: true, p: new THREE.Vector3(...p), t: new THREE.Vector3(...t) }
  }

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement)
    c.enableDamping = true
    c.dampingFactor = 0.09
    c.minDistance = 7
    c.maxDistance = 70
    c.minPolarAngle = 0.12
    c.maxPolarAngle = Math.PI / 2 - 0.06
    c.target.set(0, 0.6, 0)
    c.update()
    ctrl.current = c
    return () => c.dispose()
  }, [camera, gl])

  useFrame((_, dt) => {
    const a = anim.current
    if (a.active && ctrl.current) {
      const k = Math.min(1, dt * 3)
      camera.position.lerp(a.p, k)
      ctrl.current.target.lerp(a.t, k)
      if (camera.position.distanceTo(a.p) < 0.06) a.active = false
    }
    ctrl.current?.update()
  })

  /* 首次进入：从高处缓缓落到位（配合外层淡入） */
  useEffect(() => {
    camera.position.set(26, 40, 44)
    if (ctrl.current) {
      ctrl.current.target.set(0, 0.6, 0)
      fly.current?.([20, 25, 30], [0, 0.6, 0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function Wall({
  x,
  z,
  w,
  d,
  opacity,
  focused,
}: {
  x: number
  z: number
  w: number
  d: number
  opacity: number
  focused: boolean
}) {
  return (
    <mesh position={[x, WALL_H / 2, z]}>
      <boxGeometry args={[w, WALL_H, d]} />
      <meshStandardMaterial
        color={focused ? '#14507f' : '#0d3a63'}
        emissive={focused ? '#3fa9ff' : '#2f7bd6'}
        emissiveIntensity={focused ? 0.3 : 0.12}
        metalness={0.4}
        roughness={0.5}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

function DoorMesh({
  roomId,
  pos,
  hovered,
  onHover,
  onEnter,
}: {
  roomId: string
  pos: [number, number]
  hovered: boolean
  onHover: (id: string | null) => void
  onEnter: () => void
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const padMat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 6)
    const t = hovered ? 1.6 : 0.75
    if (mat.current) mat.current.emissiveIntensity += (t - mat.current.emissiveIntensity) * k
    if (padMat.current) padMat.current.opacity += ((hovered ? 0.4 : 0.18) - padMat.current.opacity) * k
  })
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh
        position={[0, WALL_H / 2 + 0.1, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          onHover(roomId)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = ''
          onHover(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onEnter()
        }}
      >
        <boxGeometry args={[2.3, WALL_H + 0.2, 0.18]} />
        <meshStandardMaterial ref={mat} color="#1d6fa8" emissive="#5fd8ff" emissiveIntensity={0.75} metalness={0.4} roughness={0.3} transparent opacity={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0.9]}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshBasicMaterial ref={padMat} color="#5fd8ff" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ============ 非办公房间陈设（会议桌椅 / 洽谈桌 / 热水器等） ============ */
function FurnBox({
  p,
  s,
  color,
  emissive,
  ei = 0.12,
  op = 1,
}: {
  p: [number, number, number]
  s: [number, number, number]
  color: string
  emissive?: string
  ei?: number
  op?: number
}) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={color}
        metalness={0.35}
        roughness={0.6}
        emissive={emissive ?? "#3fa9ff"}
        emissiveIntensity={ei}
        transparent
        opacity={op}
      />
    </mesh>
  )
}

function FurnCyl({
  p,
  r,
  h,
  color,
  emissive,
  ei = 0.12,
  op = 1,
}: {
  p: [number, number, number]
  r: number
  h: number
  color: string
  emissive?: string
  ei?: number
  op?: number
}) {
  return (
    <mesh position={p}>
      <cylinderGeometry args={[r, r, h, 20]} />
      <meshStandardMaterial
        color={color}
        metalness={0.35}
        roughness={0.6}
        emissive={emissive ?? "#3fa9ff"}
        emissiveIntensity={ei}
        transparent
        opacity={op}
      />
    </mesh>
  )
}

function Chair({ p, rotY = 0, op }: { p: [number, number, number]; rotY?: number; op: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <FurnBox p={[0, 0.21, 0]} s={[0.5, 0.42, 0.5]} color="#16456f" op={op} />
      <FurnBox p={[0, 0.55, 0.26]} s={[0.48, 0.6, 0.1]} color="#1d5f96" op={op} />
    </group>
  )
}

function RoomFurniture({ room, op, focused }: { room: Room; op: number; focused: boolean }) {
  const { x0, x1, z0, z1 } = roomRect(room)
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const w = x1 - x0
  const d = z1 - z0
  const A = "#16456f"
  const B = "#0d3050"
  const T = "#1d5f96"
  const hot = focused ? 0.95 : 0.55

  /* 会议室（大会议桌 + 两排椅 + 视频屏）与洽谈室（小圆桌 + 四凳）同为 meeting，按容量区分 */
  if (room.kind === 'meeting') {
    if (room.capacity >= 8) {
      const tw = Math.min(5, w * 0.55)
      const seats: React.ReactNode[] = []
      for (let i = 0; i < 3; i++) {
        const x = cx + (i - 1) * (tw / 2.6)
        seats.push(<Chair key={'n' + i} p={[x, 0, cz - d * 0.3]} rotY={Math.PI} op={op} />)
        seats.push(<Chair key={'s' + i} p={[x, 0, cz + d * 0.3]} rotY={0} op={op} />)
      }
      return (
        <group>
          <FurnBox p={[cx, 0.68, cz]} s={[tw, 0.08, 1.5]} color={T} op={op} />
          <FurnBox p={[cx, 0.32, cz]} s={[tw * 0.45, 0.56, 0.8]} color={B} op={op} />
          {seats}
          <FurnBox p={[cx, 1.5, z0 + 0.1]} s={[1.9, 1.05, 0.08]} color={B} emissive="#4fd8ff" ei={hot} op={op} />
        </group>
      )
    }
    return (
      <group>
        <FurnCyl p={[cx, 0.7, cz]} r={0.75} h={0.08} color={T} op={op} />
        <FurnCyl p={[cx, 0.35, cz]} r={0.12} h={0.66} color={B} op={op} />
        <Chair p={[cx, 0, cz - 1.25]} rotY={Math.PI} op={op} />
        <Chair p={[cx, 0, cz + 1.25]} rotY={0} op={op} />
        <Chair p={[cx - 1.25, 0, cz]} rotY={-Math.PI / 2} op={op} />
        <Chair p={[cx + 1.25, 0, cz]} rotY={Math.PI / 2} op={op} />
      </group>
    )
  }

  if (room.kind === 'reception') {
    return (
      <group>
        {/* 前台接待台 + 背景logo屏 */}
        <FurnBox p={[cx, 0.55, cz - d * 0.08]} s={[w * 0.5, 1.06, 0.75]} color={A} op={op} />
        <FurnBox p={[cx, 1.11, cz - d * 0.08]} s={[w * 0.54, 0.08, 0.85]} color={T} op={op} />
        <FurnBox p={[cx, 1.75, z0 + 0.12]} s={[w * 0.42, 0.95, 0.08]} color={B} emissive="#4fd8ff" ei={hot} op={op} />
      </group>
    )
  }

  if (room.kind === 'display') {
    const stands: React.ReactNode[] = []
    for (let i = 0; i < 3; i++) {
      const x = x0 + w * (0.2 + i * 0.3)
      stands.push(
        <group key={i}>
          <FurnBox p={[x, 0.5, cz]} s={[1.1, 1.0, 1.1]} color={A} op={op} />
          <FurnBox p={[x, 1.04, cz]} s={[0.72, 0.07, 0.72]} color="#4fd8ff" emissive="#4fd8ff" ei={hot} op={op} />
        </group>,
      )
    }
    return <group>{stands}</group>
  }

  if (room.kind === 'pantry') {
    return (
      <group>
        {/* 操作台（贴左墙） */}
        <FurnBox p={[x0 + 0.34, 0.44, cz]} s={[0.62, 0.88, d * 0.62]} color={A} op={op} />
        <FurnBox p={[x0 + 0.34, 0.9, cz]} s={[0.68, 0.06, d * 0.66]} color={T} op={op} />
        {/* 热水器（挂墙圆筒 + 出水口） */}
        <FurnCyl p={[x0 + 0.3, 1.5, cz - d * 0.16]} r={0.24} h={0.7} color="#2f7bd6" emissive="#7fe4ff" ei={hot} op={op} />
        <FurnBox p={[x0 + 0.44, 1.04, cz - d * 0.16]} s={[0.14, 0.1, 0.14]} color="#4fd8ff" emissive="#4fd8ff" ei={hot} op={op} />
        {/* 冰箱（右后角） */}
        <FurnBox p={[x1 - 0.42, 0.75, z0 + 0.5]} s={[0.64, 1.5, 0.62]} color="#2a6191" op={op} />
        {/* 休息小圆桌 + 两张圆凳 */}
        <FurnCyl p={[cx + w * 0.12, 0.68, cz + d * 0.14]} r={0.45} h={0.07} color={T} op={op} />
        <FurnCyl p={[cx + w * 0.12 - 0.75, 0.24, cz + d * 0.14]} r={0.19} h={0.48} color={A} op={op} />
        <FurnCyl p={[cx + w * 0.12 + 0.75, 0.24, cz + d * 0.14]} r={0.19} h={0.48} color={A} op={op} />
      </group>
    )
  }

  if (room.kind === 'other') {
    return (
      <group>
        {/* 打印机（柜体 + 机身 + 出纸口指示） */}
        <FurnBox p={[cx - w * 0.15, 0.3, cz]} s={[0.7, 0.6, 0.6]} color={B} op={op} />
        <FurnBox p={[cx - w * 0.15, 0.75, cz]} s={[0.85, 0.4, 0.66]} color={A} op={op} />
        <FurnBox p={[cx - w * 0.15, 0.98, cz]} s={[0.5, 0.06, 0.4]} color="#4fd8ff" emissive="#4fd8ff" ei={hot} op={op} />
        {/* 耗材柜 */}
        <FurnBox p={[cx + w * 0.24, 0.85, cz]} s={[0.45, 1.7, 1.5]} color={B} op={op} />
      </group>
    )
  }

  return null
}

/* ============ 三级：工位详情面板 ============ */
function DeskPanel({ desk, onClose, onJump }: { desk: Desk; onClose: () => void; onJump: (id: string) => void }) {
  const staff = desk.staff
  const neigh = neighborsOf(desk, 2)
  const hist = deskHistory(desk)
  return (
    <aside className="bs-drawer">
      <header className="bs-drawer-head">
        <span className="bs-drawer-id">{desk.id}</span>
        <span className={`bs-pill is-${desk.status}`}>{desk.status}</span>
        <button className="bs-drawer-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
      </header>

      <div className="bs-drawer-body">
        {staff ? (
          <div className="bs-drawer-person">
            <span className="bs-avatar">{staff.name.slice(0, 1)}</span>
            <div className="bs-drawer-person-meta">
              <b>{staff.name}</b>
              <span>
                {staff.dept} · {staff.title}
              </span>
            </div>
          </div>
        ) : (
          <div className="bs-drawer-person is-empty">
            <span className="bs-avatar">空</span>
            <div className="bs-drawer-person-meta">
              <b>{desk.status}工位</b>
              <span>{desk.note ?? '当前无使用者，可直接分配'}</span>
            </div>
          </div>
        )}

        <div className="bs-kv">
          <div>
            <span>所在楼层</span>
            <b>{desk.floor}F</b>
          </div>
          <div>
            <span>所属房间</span>
            <b>{desk.roomName}</b>
          </div>
          <div>
            <span>工位类型</span>
            <b>{desk.type}</b>
          </div>
          <div>
            <span>使用起始</span>
            <b>{desk.since ?? '—'}</b>
          </div>
          {staff && (
            <>
              <div>
                <span>员工编号</span>
                <b>{staff.id}</b>
              </div>
              <div>
                <span>邮箱</span>
                <b className="bs-ellipsis">{staff.email}</b>
              </div>
              <div>
                <span>入职日期</span>
                <b>{staff.joinDate}</b>
              </div>
            </>
          )}
        </div>

        <div className="bs-block-title">
          <i />
          工位设备
        </div>
        <div className="bs-chips">
          {desk.equipment.map((e) => (
            <span className="bs-chip" key={e}>
              {e}
            </span>
          ))}
        </div>

        <div className="bs-block-title">
          <i />
          邻座
        </div>
        <ul className="bs-neigh">
          {neigh.map((n) => (
            <li key={n.id} onClick={() => onJump(n.id)}>
              <span className="bs-neigh-id">{n.id}</span>
              <span className="bs-neigh-name">{n.staff ? `${n.staff.name} · ${n.staff.dept}` : `${n.status}工位`}</span>
              <span className="bs-neigh-go">定位</span>
            </li>
          ))}
        </ul>

        <div className="bs-block-title">
          <i />
          变更记录
        </div>
        <ul className="bs-log">
          {hist.map((h, i) => (
            <li key={`${h.date}-${i}`}>
              <span className="bs-log-dot" />
              <div>
                <b>{h.date}</b>
                <span>{h.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

function roomBadge(room: Room, deskCount: number) {
  switch (room.kind) {
    case 'office':
      return `${deskCount} 工位`
    case 'meeting':
      return `容纳 ${room.capacity} 人`
    case 'pantry':
      return '茶水休闲'
    case 'reception':
      return '前台接待'
    case 'display':
      return '产品展示'
    default:
      return '服务用房'
  }
}

/* ============ 房门引线 + 人员面板（对照大屏地图悬停） ============ */
const HV_PANEL_W = 238

function DoorCallout({
  room,
  anchor,
  stageW,
  stageH,
  onEnter,
}: {
  room: Room
  anchor: { x: number; y: number }
  stageW: number
  stageH: number
  onEnter: () => void
}) {
  const floor = building.floors.find((f) => f.rooms.some((r) => r.id === room.id))
  const desks = (floor?.desks ?? []).filter((d) => d.roomId === room.id)
  const people = desks.filter((d) => d.staff)
  const isOffice = room.kind === 'office'
  const rows = isOffice ? Math.min(people.length, 8) : 0
  const panelH = isOffice ? 86 + rows * 21 + 26 : 104

  const cx = stageW / 2
  const cy = stageH / 2
  const dx = anchor.x - cx
  const dy = anchor.y - cy
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len

  const px = Math.min(Math.max(anchor.x + ux * 130, 10), Math.max(10, stageW - HV_PANEL_W - 10))
  const py = Math.min(Math.max(anchor.y + uy * 60 - panelH / 2, 10), Math.max(10, stageH - panelH - 10))
  /* 引线：锚点 → 横段 → 竖段到面板最近边（保证线段不被面板盖住） */
  const nx = Math.min(Math.max(anchor.x, px), px + HV_PANEL_W)
  const ny = Math.min(Math.max(anchor.y, py), py + panelH)

  return (
    <div className="bs-hv-layer">
      <svg className="bs-hv-svg" width={stageW} height={stageH}>
        <defs>
          <marker id="bsHvArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#7fe4ff" strokeWidth="1.6" strokeLinecap="round" />
          </marker>
        </defs>
        <circle cx={anchor.x} cy={anchor.y} r="4" className="bs-hv-dot-core" />
        <circle cx={anchor.x} cy={anchor.y} r="4" className="bs-hv-dot-ring" />
        <path
          key={room.id}
          className="bs-hv-line"
          d={`M ${anchor.x} ${anchor.y} L ${nx.toFixed(1)} ${anchor.y.toFixed(1)} L ${nx.toFixed(1)} ${ny.toFixed(1)}`}
          pathLength={1}
          markerEnd="url(#bsHvArrow)"
        />
      </svg>

      <div className="bs-hv-panel" style={{ left: px, top: py, width: HV_PANEL_W }} onClick={onEnter}>
        <div className="bs-hv-head">
          <b>{room.name}</b>
          <span className="bs-hv-badge">{roomBadge(room, desks.length)}</span>
        </div>
        {isOffice ? (
          <ul className="bs-hv-rows">
            {people.slice(0, 8).map((d) => (
              <li key={d.id}>
                <i style={{ background: deptColor(d.staff) }} />
                <b>{d.staff!.name}</b>
                <span>{d.staff!.dept}</span>
              </li>
            ))}
            {people.length === 0 && <li className="bs-hv-more">暂无人员</li>}
            {people.length > 8 && <li className="bs-hv-more">等共 {people.length} 人</li>}
          </ul>
        ) : (
          <div className="bs-hv-note">{room.note || `容纳 ${room.capacity} 人`}</div>
        )}
        <div className="bs-hv-foot">点击进入房间 →</div>
      </div>
    </div>
  )
}

/* 门的世界坐标 → 屏幕坐标（悬停期间每帧回写， camera 有阻尼位移时面板跟随） */
function DoorAnchor({
  room,
  active,
  onMove,
}: {
  room: Room
  active: boolean
  onMove: (p: { x: number; y: number }) => void
}) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])
  const last = useRef({ x: -999, y: -999 })
  const door = roomDoor(room)
  useFrame(() => {
    if (!active) return
    v.set(door[0], 2.1, door[1]).project(camera)
    const x = (v.x * 0.5 + 0.5) * size.width
    const y = (-v.y * 0.5 + 0.5) * size.height
    if (Math.abs(x - last.current.x) > 2 || Math.abs(y - last.current.y) > 2) {
      last.current = { x, y }
      onMove({ x, y })
    }
  })
  return null
}

/* ============ 楼层内部场景 ============ */
function FloorScene({
  floor,
  focusRoomId,
  hoveredRoomId,
  selectedDeskId,
  onHoverRoom,
  onEnterRoom,
  onDeskSelect,
  resetKey,
}: {
  floor: Floor
  focusRoomId: string | null
  hoveredRoomId: string | null
  selectedDeskId: string | null
  onHoverRoom: (id: string | null) => void
  onEnterRoom: (id: string | null) => void
  onDeskSelect: (id: string) => void
  resetKey: number
}) {
  const fly = useRef<((p: [number, number, number], t: [number, number, number]) => void) | null>(null)
  const focusRoom = floor.rooms.find((r) => r.id === focusRoomId) ?? null
  const plateGeo = useMemo(() => new THREE.BoxGeometry(W, 0.3, D), [])

  /* 楼层切换 / 房间聚焦 → 相机飞行 */
  useEffect(() => {
    if (focusRoom) {
      const [dx, dz] = roomDoor(focusRoom)
      const [cx, cz] = roomCenter(focusRoom)
      fly.current?.([dx, 7.5, dz + 11], [cx, 0.5, cz])
    } else {
      fly.current?.([20, 25, 30], [0, 0.6, 0])
    }
  }, [floor.index, focusRoomId, resetKey])

  return (
    <>
      <fog attach="fog" args={['#061a38', 90, 240]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[30, 50, 26]} intensity={1.2} color="#e6f4ff" />
      <directionalLight position={[-40, 30, -30]} intensity={0.55} color="#4fa6ff" />

      <FloorControls fly={fly} />

      {/* 本层楼板 */}
      <mesh position={[0, -0.15, 0]} geometry={plateGeo}>
        <meshStandardMaterial color="#0a2c4c" metalness={0.5} roughness={0.6} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[plateGeo]} />
        <lineBasicMaterial color="#3fa9ff" transparent opacity={0.5} />
      </lineSegments>
      <gridHelper args={[160, 40, '#173f6e', '#0c2547']} position={[0, -3.2, 0]} />

      {/* 房间：墙体 + 门 + 名称 */}
      {floor.rooms.map((r) => {
        const { x0, x1, z0, z1 } = roomRect(r)
        const doorX = roomDoor(r)[0]
        const isFocus = focusRoomId === r.id
        const dim = focusRoomId !== null && !isFocus
        const op = dim ? 0.16 : isFocus ? 0.78 : 0.5
        const seg1W = Math.max(0.1, doorX - 1.3 - x0)
        const seg2W = Math.max(0.1, x1 - (doorX + 1.3))
        return (
          <group key={r.id}>
            <Wall x={(x0 + x1) / 2} z={z0} w={x1 - x0} d={0.14} opacity={op} focused={isFocus} />
            <Wall x={x0} z={(z0 + z1) / 2} w={0.14} d={z1 - z0} opacity={op} focused={isFocus} />
            <Wall x={x1} z={(z0 + z1) / 2} w={0.14} d={z1 - z0} opacity={op} focused={isFocus} />
            <Wall x={(x0 + doorX - 1.3) / 2} z={z1} w={seg1W} d={0.14} opacity={op} focused={isFocus} />
            <Wall x={(doorX + 1.3 + x1) / 2} z={z1} w={seg2W} d={0.14} opacity={op} focused={isFocus} />
            <lineSegments position={[(x0 + x1) / 2, 0.04, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(x1 - x0, z1 - z0)]} />
              <lineBasicMaterial color={isFocus ? '#7fe4ff' : '#3f8fc4'} transparent opacity={dim ? 0.12 : 0.5} />
            </lineSegments>
            <DoorMesh
              roomId={r.id}
              pos={roomDoor(r)}
              hovered={hoveredRoomId === r.id}
              onHover={onHoverRoom}
              onEnter={() => onEnterRoom(r.id)}
            />
            {r.kind !== "office" && <RoomFurniture room={r} op={op} focused={isFocus} />}
            <RoomLabel room={r} dim={dim} hidden={isFocus} />
          </group>
        )
      })}

      {/* 工位 */}
      {floor.desks.map((d) => {
        const [wx, wz] = planToWorld(d.x, d.y)
        const dim = focusRoomId !== null && d.roomId !== focusRoomId
        return (
          <DeskMesh
            key={d.id}
            desk={d}
            world={[wx, 0, wz]}
            dim={dim}
            selected={selectedDeskId === d.id}
            onClick={() => onDeskSelect(d.id)}
          />
        )
      })}

      {/* 聚焦房间时显示每个工位的使用者名牌 */}
      {focusRoom &&
        floor.desks
          .filter((d) => d.roomId === focusRoom.id)
          .map((d) => {
            const [wx, wz] = planToWorld(d.x, d.y)
            return <DeskNameLabel key={`lb-${d.id}`} text={d.staff ? d.staff.name : d.status} pos={[wx, 1.9, wz]} />
          })}
    </>
  )
}

function RoomLabel({ room, dim, hidden }: { room: Room; dim: boolean; hidden: boolean }) {
  const tex = useLabelTexture(room.name, { small: true, color: '#dcefff' })
  const [cx, cz] = roomCenter(room)
  if (hidden) return null
  return (
    <sprite position={[cx, 2.4, cz]} scale={[6.2, 2.5, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} opacity={dim ? 0.25 : 1} />
    </sprite>
  )
}

function DeskNameLabel({ text, pos }: { text: string; pos: [number, number, number] }) {
  const tex = useLabelTexture(text, { small: true, color: '#dcefff' })
  return (
    <sprite position={pos} scale={[4.2, 1.7, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  )
}

function DeskMesh({
  desk,
  world,
  dim,
  selected,
  onClick,
}: {
  desk: Desk
  world: [number, number, number]
  dim: boolean
  selected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const grp = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 6)
    const target = selected ? 1.4 : hovered && !dim ? 0.9 : 0.28
    if (mat.current) mat.current.emissiveIntensity += (target - mat.current.emissiveIntensity) * k
    if (grp.current) {
      const s = hovered && !dim ? 1.12 : 1
      grp.current.scale.x += (s - grp.current.scale.x) * k
      grp.current.scale.z += (s - grp.current.scale.z) * k
    }
  })
  return (
    <group
      ref={grp}
      position={world}
      onClick={(e) => {
        e.stopPropagation()
        if (!dim) onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        setHovered(true)
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
        setHovered(false)
      }}
    >
      {/* 桌面 */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.15, 0.09, 0.75]} />
        <meshStandardMaterial
          ref={mat}
          color="#1a4f80"
          emissive={STATUS_COLOR[desk.status]}
          emissiveIntensity={0.28}
          metalness={0.45}
          roughness={0.45}
          transparent
          opacity={dim ? 0.18 : 1}
        />
      </mesh>
      {/* 状态灯 */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[0.2, 0.07, 0.2]} />
        <meshStandardMaterial
          color={STATUS_COLOR[desk.status]}
          emissive={STATUS_COLOR[desk.status]}
          emissiveIntensity={dim ? 0.2 : 1.4}
          transparent
          opacity={dim ? 0.2 : 1}
        />
      </mesh>
      {/* 椅子 */}
      <mesh position={[0, 0.32, 0.62]}>
        <boxGeometry args={[0.52, 0.55, 0.5]} />
        <meshStandardMaterial color="#0d3050" metalness={0.3} roughness={0.7} transparent opacity={dim ? 0.15 : 0.95} />
      </mesh>
      {/* 命中区（方便点选） */}
      <mesh position={[0, 0.5, 0.2]} visible={false}>
        <boxGeometry args={[1.4, 1.1, 1.5]} />
        <meshBasicMaterial />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.2]}>
          <ringGeometry args={[0.85, 1.05, 32]} />
          <meshBasicMaterial color="#7fe4ff" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

/* ============ 页面 ============ */
export default function BuildingScreen() {
  const [view, setView] = useState<'building' | 'floor'>('building')
  const [fading, setFading] = useState(false)
  const [floorNo, setFloorNo] = useState(3)
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null)
  const [focusRoomId, setFocusRoomId] = useState<string | null>(null)
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null)
  const [doorAnchor, setDoorAnchor] = useState<{ x: number; y: number } | null>(null)
  const [deskId, setDeskId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const [kw, setKw] = useState('')
  const stageRef = useRef<HTMLDivElement | null>(null)

  const floor = building.floors[floorNo - 1]
  const desk = deskId ? DESK_BY_ID[deskId] : null
  const previewNo = hoveredFloor ?? floorNo
  const previewStat = FLOOR_STATS[previewNo - 1]
  const focusRoom = focusRoomId ? floor.rooms.find((r) => r.id === focusRoomId) ?? null : null
  const hoverRoom = hoveredRoomId ? floor.rooms.find((r) => r.id === hoveredRoomId) ?? null : null

  const results = useMemo(() => {
    const q = kw.trim().toLowerCase()
    if (!q) return []
    const byStaff = ALL_DESKS.filter(
      (d) => d.staff && (d.staff.name.includes(kw.trim()) || d.staff.id.toLowerCase().includes(q)),
    )
    const byDesk = ALL_DESKS.filter((d) => d.id.toLowerCase().includes(q))
    const seen = new Set<string>()
    return [...byStaff, ...byDesk].filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true))).slice(0, 6)
  }, [kw])

  const switchView = (v: 'building' | 'floor') => {
    if (v === view) return
    setFading(true)
    window.setTimeout(() => {
      setView(v)
      setFading(false)
    }, 360)
  }

  const enterFloor = (n: number) => {
    setFloorNo(n)
    setFocusRoomId(null)
    setDeskId(null)
    switchView('floor')
  }

  const gotoDesk = (id: string) => {
    const d = DESK_BY_ID[id]
    if (!d) return
    setFloorNo(d.floor)
    setFocusRoomId(d.roomId)
    setDeskId(d.id)
    setKw('')
    switchView('floor')
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.()
  }

  const occupancy = Math.round((TOTAL_OCCUPIED / TOTAL_DESK) * 100)
  const roomDesks = focusRoom ? floor.desks.filter((d) => d.roomId === focusRoom.id) : floor.desks

  return (
    <div className="bs-screen">
      <div className="bs-halo" />

      <header className="bs-topbar">
        <span className="bs-date">{TODAY}</span>
        <div className="bs-title">
          <span className="bs-deco l">
            <i />
            <i />
            <i />
          </span>
          <h1>{BUILDING.name} · 楼宇三维与工位可视化</h1>
          <span className="bs-deco r">
            <i />
            <i />
            <i />
          </span>
        </div>
        <span className="bs-status">
          <i />
          数据同步正常
        </span>
        <div className="bs-tools">
          {view === 'floor' && (
            <button className="bs-tool" onClick={() => switchView('building')}>
              <LeftOutlined /> 返回楼栋
            </button>
          )}
          <button className="bs-tool" onClick={() => setResetKey((k) => k + 1)}>
            <ReloadOutlined /> 复位视角
          </button>
          {view === 'building' && (
            <button className={`bs-tool${autoRotate ? ' is-on' : ''}`} onClick={() => setAutoRotate((v) => !v)}>
              <SyncOutlined /> 自动旋转
            </button>
          )}
          <button className="bs-tool" onClick={toggleFullscreen}>
            <ExpandOutlined /> 全屏
          </button>
        </div>
        <div className="bs-line" />
      </header>

      <div className="bs-body">
        {/* 左列 */}
        <div className="bs-col bs-col-left">
          <section className="bs-panel">
            <div className="bs-panel-title">
              <i />
              楼栋概览
              <span className="bs-panel-tip">
                <BankOutlined /> {BUILDING.buildYear} 年
              </span>
            </div>
            <div className="bs-kpis">
              <div className="bs-kpi">
                <span className="bs-kpi-label">楼层</span>
                <span className="bs-kpi-val">
                  {N}
                  <em>层</em>
                </span>
              </div>
              <div className="bs-kpi">
                <span className="bs-kpi-label">工位总数</span>
                <span className="bs-kpi-val">
                  {TOTAL_DESK}
                  <em>个</em>
                </span>
              </div>
              <div className="bs-kpi">
                <span className="bs-kpi-label">工位占用率</span>
                <span className="bs-kpi-val">
                  {occupancy}
                  <em>%</em>
                </span>
              </div>
              <div className="bs-kpi">
                <span className="bs-kpi-label">建筑面积</span>
                <span className="bs-kpi-val">
                  {TOTAL_AREA.toLocaleString()}
                  <em>m²</em>
                </span>
              </div>
            </div>
          </section>

          <section className="bs-panel bs-panel-grow">
            <div className="bs-panel-title">
              <i />
              楼层占用
              <span className="bs-panel-tip">点击进入该层</span>
            </div>
            <ul className="bs-floors">
              {FLOOR_STATS.map((s) => (
                <li
                  key={s.index}
                  className={`${
                    hoveredFloor === s.index ? ' is-hover' : ''
                  }${floorNo === s.index && view === 'floor' ? ' is-current' : ''}`}
                  onMouseEnter={() => setHoveredFloor(s.index)}
                  onMouseLeave={() => setHoveredFloor(null)}
                  onClick={() => enterFloor(s.index)}
                >
                  <span className="bs-floor-no">{s.label}</span>
                  <span className="bs-floor-mid">
                    <span className="bs-floor-usage">{s.usage}</span>
                    <span className="bs-bar">
                      <i style={{ width: `${Math.round(s.rate * 100)}%` }} />
                    </span>
                  </span>
                  <span className="bs-floor-right">
                    <b>{Math.round(s.rate * 100)}%</b>
                    <em>
                      {s.occupied}/{s.total}
                    </em>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bs-panel">
            <div className="bs-panel-title">
              <i />
              查找工位
              <span className="bs-panel-tip">姓名 / 工号 / 工位号</span>
            </div>
            <div className="bs-search">
              <SearchOutlined />
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="例如 张明 或 3F-A-07"
                aria-label="查找工位"
              />
            </div>
            {!!results.length && (
              <ul className="bs-results">
                {results.map((d) => (
                  <li key={d.id} onClick={() => gotoDesk(d.id)}>
                    <b>{d.staff ? d.staff.name : d.status}</b>
                    <span>
                      {d.id} · {d.roomName}
                    </span>
                    <AimOutlined className="bs-results-go" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 中央舞台 */}
        <div className="bs-stage" ref={stageRef}>
          <div className={`bs-stage-fade${fading ? ' is-hidden' : ''}`}>
            {view === 'building' ? (
              <>
                <Canvas
                  dpr={[1, 2]}
                  camera={{ position: [54, 33, 62], fov: 36, near: 0.5, far: 800 }}
                  gl={{ antialias: true, alpha: true }}
                >
                  <BuildingScene
                    hoveredFloor={hoveredFloor}
                    onHover={setHoveredFloor}
                    onEnter={enterFloor}
                    autoRotate={autoRotate}
                    resetKey={resetKey}
                  />
                </Canvas>
                <div className="bs-stage-hint">
                  <span>拖拽旋转</span>
                  <span>滚轮缩放</span>
                  <span>点击楼层直接进入</span>
                </div>

              </>
            ) : (
              <>
                <Canvas
                  dpr={[1, 2]}
                  camera={{ position: [26, 40, 44], fov: 40, near: 0.3, far: 600 }}
                  gl={{ antialias: true, alpha: true }}
                >
                  <FloorScene
                    floor={floor}
                    focusRoomId={focusRoomId}
                    hoveredRoomId={hoveredRoomId}
                    selectedDeskId={deskId}
                    onHoverRoom={setHoveredRoomId}
                    onEnterRoom={(id) => setFocusRoomId((cur) => (cur === id ? null : id))}
                    onDeskSelect={setDeskId}
                    resetKey={resetKey}
                  />
                  {hoverRoom && (
                    <DoorAnchor
                      room={hoverRoom}
                      active
                      onMove={(p) => setDoorAnchor((prev) => (prev && prev.x === p.x && prev.y === p.y ? prev : p))}
                    />
                  )}
                </Canvas>

                {hoverRoom && doorAnchor && stageRef.current && (
                  <DoorCallout
                    room={hoverRoom}
                    anchor={doorAnchor}
                    stageW={stageRef.current.clientWidth}
                    stageH={stageRef.current.clientHeight}
                    onEnter={() => setFocusRoomId((cur) => (cur === hoverRoom.id ? null : hoverRoom.id))}
                  />
                )}

                <div className="bs-crumb">
                  <a onClick={() => switchView('building')}>楼栋</a>
                  <span>›</span>
                  <a onClick={() => setFocusRoomId(null)}>{floor.label}</a>
                  {focusRoom && (
                    <>
                      <span>›</span>
                      <b>{focusRoom.name}</b>
                    </>
                  )}
                </div>
                <div className="bs-stage-hint">
                  <span>拖拽旋转</span>
                  <span>悬停房门查看人员</span>
                  <span>点击房门进入</span>
                  <span>点击工位看详情</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 右列 */}
        <div className="bs-col bs-col-right">
          {view === 'building' ? (
            <>
              <section className="bs-panel">
                <div className="bs-panel-title">
                  <i />
                  {hoveredFloor !== null ? `${hoveredFloor}F 楼层详情` : '楼层详情'}
                  <span className="bs-panel-tip">悬停预览 · 点击进入</span>
                </div>
                {hoveredFloor !== null ? (
                  <>
                    <div className="bs-kv bs-kv-2">
                      <div>
                        <span>用途</span>
                        <b>{previewStat.usage}</b>
                      </div>
                      <div>
                        <span>使用面积</span>
                        <b>{previewStat.area} m²</b>
                      </div>
                      <div>
                        <span>工位数</span>
                        <b>{previewStat.total}</b>
                      </div>
                      <div>
                        <span>占用率</span>
                        <b>{Math.round(previewStat.rate * 100)}%</b>
                      </div>
                    </div>
                    <div className="bs-mini-bars">
                      <div>
                        <span>占用</span>
                        <i>
                          <b style={{ width: `${(previewStat.occupied / previewStat.total) * 100}%` }} />
                        </i>
                        <em>{previewStat.occupied}</em>
                      </div>
                      <div>
                        <span>空闲</span>
                        <i>
                          <b className="is-gray" style={{ width: `${(previewStat.free / previewStat.total) * 100}%` }} />
                        </i>
                        <em>{previewStat.free}</em>
                      </div>
                      <div>
                        <span>预留</span>
                        <i>
                          <b className="is-amber" style={{ width: `${(previewStat.reserved / previewStat.total) * 100}%` }} />
                        </i>
                        <em>{previewStat.reserved}</em>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bs-empty">悬停三维场景或左侧列表中的楼层预览详情，点击直接进入</div>
                )}
              </section>

              <section className="bs-panel bs-panel-grow">
                <div className="bs-panel-title">
                  <i />
                  部门分布
                  <span className="bs-panel-tip">
                    <TeamOutlined /> 按占用工位统计
                  </span>
                </div>
                <ul className="bs-rank">
                  {DEPT_DIST.slice(0, 8).map((d, i) => (
                    <li key={d.dept}>
                      <span className="bs-rank-idx">{i + 1}</span>
                      <span className="bs-rank-name">{d.dept}</span>
                      <span className="bs-rank-bar">
                        <i style={{ width: `${(d.count / DEPT_DIST[0].count) * 100}%` }} />
                      </span>
                      <span className="bs-rank-val">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <>
              <section className="bs-panel">
                <div className="bs-panel-title">
                  <i />
                  {floor.label} 楼层信息
                  <span className="bs-panel-tip">{floor.usage}</span>
                </div>
                <div className="bs-kv bs-kv-2">
                  {(() => {
                    const s = FLOOR_STATS[floor.index - 1]
                    return (
                      <>
                        <div>
                          <span>使用面积</span>
                          <b>{s.area} m²</b>
                        </div>
                        <div>
                          <span>工位数</span>
                          <b>{s.total}</b>
                        </div>
                        <div>
                          <span>占用率</span>
                          <b>{Math.round(s.rate * 100)}%</b>
                        </div>
                        <div>
                          <span>空置</span>
                          <b>
                            {s.free + s.reserved} 个
                          </b>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </section>

              <section className="bs-panel">
                <div className="bs-panel-title">
                  <i />
                  房间
                  <span className="bs-panel-tip">点击进入</span>
                </div>
                <ul className="bs-room-list">
                  {floor.rooms.map((r) => (
                    <li
                      key={r.id}
                      className={focusRoomId === r.id ? 'is-active' : ''}
                      onClick={() => setFocusRoomId((cur) => (cur === r.id ? null : r.id))}
                    >
                      <span className="bs-room-list-name">{r.name}</span>
                      <span className="bs-room-list-meta">
                        {roomBadge(r, floor.desks.filter((d) => d.roomId === r.id).length)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bs-panel bs-panel-grow">
                <div className="bs-panel-title">
                  <i />
                  {focusRoom ? `${focusRoom.name} · 工位` : '全部工位'}
                  <span className="bs-panel-tip">点击查看详情</span>
                </div>
                <ul className="bs-desk-list">
                  {roomDesks.map((d) => (
                    <li key={d.id} className={deskId === d.id ? 'is-active' : ''} onClick={() => setDeskId(d.id)}>
                      <span className="bs-desk-dot" style={{ background: STATUS_COLOR[d.status] }} />
                      <span className="bs-desk-id">{d.id}</span>
                      <span className="bs-desk-name">{d.staff ? d.staff.name : d.status}</span>
                      <span className="bs-desk-dept">{d.staff ? d.staff.dept : '—'}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>

      {desk && <DeskPanel desk={desk} onClose={() => setDeskId(null)} onJump={gotoDesk} />}

      <div className="bs-vignette" />
    </div>
  )
}
