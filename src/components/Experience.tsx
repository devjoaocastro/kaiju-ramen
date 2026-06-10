import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Environment,
  Float,
  Html,
  Lightformer,
  Sparkles,
  useCursor,
  useScroll,
} from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { easing } from '../lib/easing'
import { PAGES, setScrollEl } from '../scrollBus'

/* ------------------------------------------------------------------ */
/* World layout — the camera flies FORWARD (−z) through a tunnel of    */
/* torii gates. Each DOM page owns a slab of depth; 3D anchors sit     */
/* ~10 units ahead of where the camera rests for that page.            */
/* ------------------------------------------------------------------ */

const SECTION_GAP = 14
const DEPTH = SECTION_GAP * (PAGES - 1) // 84

/** z anchor for section i — the camera parks at z = 10 − i·GAP, so
 *  content placed at −i·GAP floats ten units ahead of the lens. */
const at = (i: number) => -i * SECTION_GAP

const RED = '#ff2e2e'
const PINK = '#ff7eb6'
const AMBER = '#ffb054'

/* ------------------------------------------------------------------ */
/* ToriiGate — the sacred red gate, built from boxes. The camera       */
/* threads straight through the opening between sections.              */
/* ------------------------------------------------------------------ */

function ToriiGate({ z, scale = 1 }: { z: number; scale?: number }) {
  return (
    <group position={[0, 0, z]} scale={scale}>
      {/* pillars */}
      <mesh position={[-2.9, 2.2, 0]}>
        <boxGeometry args={[0.45, 4.4, 0.45]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.22} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[2.9, 2.2, 0]}>
        <boxGeometry args={[0.45, 4.4, 0.45]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.22} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* kasagi — top lintel */}
      <mesh position={[0, 4.62, 0]}>
        <boxGeometry args={[8.2, 0.5, 0.62]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.3} roughness={0.35} metalness={0.35} />
      </mesh>
      {/* upturned tips */}
      <mesh position={[-3.95, 4.78, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[0.7, 0.42, 0.62]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.3} roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[3.95, 4.78, 0]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[0.7, 0.42, 0.62]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.3} roughness={0.35} metalness={0.35} />
      </mesh>
      {/* shimaki — secondary beam under the lintel */}
      <mesh position={[0, 4.18, 0]}>
        <boxGeometry args={[7.2, 0.3, 0.5]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* nuki — tie beam through the pillars */}
      <mesh position={[0, 3.15, 0]}>
        <boxGeometry args={[6.9, 0.32, 0.36]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.22} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* gakuzuka — central strut */}
      <mesh position={[0, 3.65, 0]}>
        <boxGeometry args={[0.34, 0.72, 0.34]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* NoodleRing — glossy floating torus. Hover: grows, blushes pink,     */
/* spins faster. Click: kicks a spin impulse into it.                  */
/* ------------------------------------------------------------------ */

function NoodleRing({
  position,
  radius = 0.7,
  tube = 0.22,
  speed = 0.4,
}: {
  position: [number, number, number]
  radius?: number
  tube?: number
  speed?: number
}) {
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const impulse = useRef(0)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    impulse.current = THREE.MathUtils.damp(impulse.current, 0, 1.6, delta)
    const k = (hovered ? 2.6 : 1) + impulse.current
    mesh.current.rotation.x += delta * speed * k
    mesh.current.rotation.y += delta * speed * 1.4 * k
    easing.damp3(mesh.current.scale, hovered ? 1.28 : 1, 0.18, delta)
    easing.dampC(mat.current.color, hovered ? PINK : AMBER, 0.2, delta)
    easing.dampC(mat.current.emissive, hovered ? PINK : '#7a3c12', 0.2, delta)
    easing.damp(mat.current, 'emissiveIntensity', hovered ? 0.9 : 0.3, 0.2, delta)
  })

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.7}>
      <mesh
        ref={mesh}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={() => (impulse.current += 7)}
      >
        <torusGeometry args={[radius, tube, 24, 72]} />
        <meshStandardMaterial ref={mat} color={AMBER} emissive="#7a3c12" emissiveIntensity={0.3} metalness={0.9} roughness={0.08} />
      </mesh>
    </Float>
  )
}

/* ------------------------------------------------------------------ */
/* Bowl — sphere segment shell + torus rim + glowing broth + steam.    */
/* ------------------------------------------------------------------ */

function Bowl({ steam = true, brothColor = AMBER }: { steam?: boolean; brothColor?: string }) {
  return (
    <group>
      {/* shell — bottom half-sphere */}
      <mesh>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#1c0d0d" roughness={0.18} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.06, 16, 64]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.5} metalness={0.6} roughness={0.25} />
      </mesh>
      {/* broth surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <circleGeometry args={[0.94, 48]} />
        <meshStandardMaterial color={brothColor} emissive={brothColor} emissiveIntensity={0.85} roughness={0.3} />
      </mesh>
      {/* nori fin */}
      <mesh position={[-0.45, 0.28, -0.3]} rotation={[0, 0.5, 0.08]}>
        <boxGeometry args={[0.5, 0.6, 0.03]} />
        <meshStandardMaterial color="#0d1408" roughness={0.6} />
      </mesh>
      {/* soft-egg halves */}
      <mesh position={[0.4, 0.04, 0.25]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color="#fff3da" emissive="#ffb054" emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0.08, 0.04, 0.48]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color="#fff3da" emissive="#ffb054" emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      {steam && (
        <Sparkles count={42} scale={[1.3, 1.9, 1.3]} position={[0, 1.1, 0]} size={4.5} speed={1.1} color="#ffd9c2" opacity={0.55} noise={0.6} />
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* HeroBowl — the big steaming centerpiece. Hover warms the broth,     */
/* click stirs it (spin impulse).                                      */
/* ------------------------------------------------------------------ */

function HeroBowl() {
  const group = useRef<THREE.Group>(null!)
  const impulse = useRef(0)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    impulse.current = THREE.MathUtils.damp(impulse.current, 0, 1.5, delta)
    group.current.rotation.y += delta * (0.25 + impulse.current)
    easing.damp3(group.current.scale, hovered ? 1.78 : 1.65, 0.2, delta)
  })

  return (
    <group
      ref={group}
      scale={1.65}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={() => (impulse.current += 5)}
    >
      <Bowl />
      <pointLight position={[0, 1, 0]} intensity={hovered ? 12 : 6} distance={7} color={AMBER} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* MenuBowl — one bowl per signature dish. Grows on hover; its Html    */
/* label fades with the scroll so it never bleeds through other        */
/* sections (terranova DistrictPin fix).                               */
/* ------------------------------------------------------------------ */

function MenuBowl({
  position,
  name,
  price,
  brothColor,
}: {
  position: [number, number, number]
  name: string
  price: string
  brothColor: string
}) {
  const group = useRef<THREE.Group>(null!)
  const label = useRef<HTMLDivElement>(null)
  const scroll = useScroll()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((state, delta) => {
    easing.damp3(group.current.scale, hovered ? 1.42 : 1, 0.18, delta)
    group.current.rotation.y += delta * (hovered ? 1.1 : 0.2)
    group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.3 + position[0]) * 0.08

    // HTML labels ignore fog/depth — only show them while the Menu
    // section (page 2) is on screen, fading in/out with the scroll.
    if (label.current) {
      const sec = scroll.offset * (PAGES - 1)
      const visibility = Math.max(0, 1 - Math.abs(sec - 2) * 1.6)
      label.current.style.opacity = visibility.toFixed(3)
      label.current.style.display = visibility < 0.04 ? 'none' : ''
    }
  })

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <Bowl brothColor={brothColor} />
      <Html center position={[0, 1.9, 0]} className="bowl-html" zIndexRange={[20, 0]}>
        <div ref={label} className={`bowl-label ${hovered ? 'bowl-label--hot' : ''}`} style={{ opacity: 0, display: 'none' }}>
          <strong>{name}</strong>
          <span>{price}</span>
        </div>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Lantern — hanging emissive sphere, swings softly, lights up on      */
/* hover. `position` is the hanging point.                             */
/* ------------------------------------------------------------------ */

function Lantern({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const swing = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((state, delta) => {
    swing.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.85 + phase) * 0.13
    swing.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.6 + phase) * 0.06
    easing.damp(mat.current, 'emissiveIntensity', hovered ? 2.6 : 0.85, 0.2, delta)
    easing.damp(light.current, 'intensity', hovered ? 16 : 5, 0.2, delta)
  })

  return (
    <group position={position}>
      <group ref={swing}>
        {/* cord */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1, 6]} />
          <meshStandardMaterial color="#2a1212" roughness={0.8} />
        </mesh>
        {/* caps */}
        <mesh position={[0, -1.02, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 0.1, 12]} />
          <meshStandardMaterial color="#1a0a0a" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0, -1.74, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.1, 12]} />
          <meshStandardMaterial color="#1a0a0a" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* paper globe */}
        <mesh
          position={[0, -1.38, 0]}
          scale={[1, 1.15, 1]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshStandardMaterial ref={mat} color={AMBER} emissive={AMBER} emissiveIntensity={0.85} roughness={0.5} />
        </mesh>
        <pointLight ref={light} position={[0, -1.38, 0]} intensity={5} distance={9} color={AMBER} />
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Chopsticks — two crossed cylinders.                                 */
/* ------------------------------------------------------------------ */

function Chopsticks({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.5}>
      <group position={position} rotation={rotation}>
        <mesh rotation={[0, 0, 0.42]}>
          <cylinderGeometry args={[0.028, 0.045, 3.6, 10]} />
          <meshStandardMaterial color="#3a1410" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, -0.42]} position={[0.2, 0, 0.12]}>
          <cylinderGeometry args={[0.028, 0.045, 3.6, 10]} />
          <meshStandardMaterial color="#3a1410" roughness={0.45} metalness={0.2} />
        </mesh>
      </group>
    </Float>
  )
}

/* ------------------------------------------------------------------ */
/* TheBar — counter + stools built from primitives, lit by a neon      */
/* strip and glowing back bars.                                        */
/* ------------------------------------------------------------------ */

function Stool({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.9, 10]} />
        <meshStandardMaterial color="#1a0a0a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 20]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.15} roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial color="#1a0a0a" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

function TheBar({ z }: { z: number }) {
  return (
    <group position={[0, 0, z - 3]}>
      {/* counter top */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[8.4, 0.16, 1.5]} />
        <meshStandardMaterial color="#241010" roughness={0.15} metalness={0.65} />
      </mesh>
      {/* counter body */}
      <mesh position={[0, 0.52, 0.1]}>
        <boxGeometry args={[8.2, 1.04, 1.2]} />
        <meshStandardMaterial color="#160909" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* neon strip under the counter lip */}
      <mesh position={[0, 1.0, 0.74]}>
        <boxGeometry args={[8.0, 0.05, 0.05]} />
        <meshBasicMaterial color={PINK} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.9, 1.6]} intensity={14} distance={8} color={PINK} />
      {/* bowls resting on the counter */}
      <group position={[-2.4, 1.32, 0]} scale={0.42}>
        <Bowl />
      </group>
      <group position={[2.2, 1.32, 0]} scale={0.42}>
        <Bowl brothColor="#ff8c5a" />
      </group>
      {/* stools facing the counter */}
      <Stool x={-3} z={1.7} />
      <Stool x={-1} z={1.7} />
      <Stool x={1} z={1.7} />
      <Stool x={3} z={1.7} />
      {/* glowing back bars — bottle-shelf neon */}
      {[-3.4, -1.7, 0, 1.7, 3.4].map((x, i) => (
        <mesh key={x} position={[x, 2.5, -1.4]}>
          <boxGeometry args={[0.08, i % 2 === 0 ? 2.6 : 1.9, 0.08]} />
          <meshBasicMaterial color={i % 2 === 0 ? RED : PINK} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* ChefPot — the one pot. Steam column, glowing broth, ladle. Click    */
/* gives it a stir.                                                    */
/* ------------------------------------------------------------------ */

function ChefPot({ z }: { z: number }) {
  const group = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const impulse = useRef(0)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    impulse.current = THREE.MathUtils.damp(impulse.current, 0, 1.4, delta)
    group.current.rotation.y += delta * (0.2 + impulse.current)
    easing.damp(mat.current, 'emissiveIntensity', hovered ? 1.6 : 0.9, 0.2, delta)
    easing.damp3(group.current.scale, hovered ? 1.08 : 1, 0.2, delta)
  })

  return (
    <group
      ref={group}
      position={[2.6, 1.1, z]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={() => (impulse.current += 5)}
    >
      {/* pot body */}
      <mesh>
        <cylinderGeometry args={[1.25, 1.05, 1.5, 36, 1, true]} />
        <meshStandardMaterial color="#2a1414" roughness={0.25} metalness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* pot base */}
      <mesh position={[0, -0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 36]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* handles */}
      <mesh position={[-1.3, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.22, 0.045, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#1a0a0a" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[1.3, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.22, 0.045, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#1a0a0a" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* roiling broth */}
      <mesh position={[0, 0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 36]} />
        <meshStandardMaterial ref={mat} color={AMBER} emissive="#ff7a2e" emissiveIntensity={0.9} roughness={0.35} />
      </mesh>
      {/* ladle */}
      <group position={[0.7, 1.1, 0.3]} rotation={[0.2, 0, -0.5]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 1.5, 8]} />
          <meshStandardMaterial color="#3a1410" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.2, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#2a1414" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* steam column */}
      <Sparkles count={70} scale={[2.2, 3.4, 2.2]} position={[0, 2.4, 0]} size={5} speed={1.2} color="#ffd9c2" opacity={0.5} noise={0.7} />
      <pointLight position={[0, 1.2, 0]} intensity={hovered ? 20 : 10} distance={9} color="#ff8c3a" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* LanternRun — a receding double row of lanterns for the finale.      */
/* ------------------------------------------------------------------ */

function LanternRun({ z }: { z: number }) {
  const rows = [0, 1, 2, 3]
  return (
    <group>
      {rows.map((i) => (
        <group key={i}>
          <Lantern position={[-3.2, 4.6 + (i % 2) * 0.4, z - i * 3.4]} phase={i * 1.3} />
          <Lantern position={[3.2, 4.8 - (i % 2) * 0.4, z - i * 3.4 - 1.6]} phase={i * 2.1 + 1} />
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Experience root — flying camera, neon lights, world, post FX        */
/* ------------------------------------------------------------------ */

export default function Experience() {
  const scroll = useScroll()
  const camLight = useRef<THREE.PointLight>(null!)

  useEffect(() => {
    setScrollEl(scroll.el)
  }, [scroll.el])

  useFrame((state, delta) => {
    const o = scroll.offset
    const z = 10 - o * DEPTH

    // fly forward through the torii tunnel + gentle mouse parallax
    easing.damp3(
      state.camera.position,
      [state.pointer.x * 0.9, 1.55 - state.pointer.y * 0.4, z],
      0.28,
      delta,
    )
    state.camera.lookAt(state.pointer.x * 1.8, 1.5, z - 9)

    // a warm light rides just ahead of the lens
    camLight.current.position.set(state.pointer.x * 3, 2.4, z - 5)

    // feed the DOM progress bar
    document.documentElement.style.setProperty('--scroll', o.toFixed(4))
  })

  return (
    <>
      <ambientLight intensity={0.22} />
      <pointLight ref={camLight} intensity={42} distance={16} color="#ff5a4a" />

      {/* studio-style reflections without any network fetch */}
      <Environment resolution={64}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer color={RED} intensity={2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
          <Lightformer color={PINK} intensity={2} position={[10, 1, 0]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
        </group>
      </Environment>

      {/* wet asphalt floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -DEPTH / 2]}>
        <planeGeometry args={[60, DEPTH + 80]} />
        <meshStandardMaterial color="#120808" roughness={0.32} metalness={0.6} />
      </mesh>

      {/* ambient ember dust down the whole alley */}
      <Sparkles
        count={300}
        scale={[18, 9, DEPTH + 24]}
        position={[0, 4, -DEPTH / 2]}
        size={1.8}
        speed={0.25}
        color={PINK}
        opacity={0.42}
      />

      {/* torii tunnel — one gate between every pair of sections */}
      <ToriiGate z={at(0) - 7} />
      <ToriiGate z={at(1) - 7} scale={1.06} />
      <ToriiGate z={at(2) - 7} />
      <ToriiGate z={at(3) - 7} scale={1.06} />
      <ToriiGate z={at(4) - 7} />
      <ToriiGate z={at(5) - 7} scale={1.12} />

      {/* lanterns strung along the alley */}
      <Lantern position={[-4.4, 5, at(0) - 3]} phase={0.4} />
      <Lantern position={[4.2, 5.2, at(0) - 10]} phase={1.7} />
      <Lantern position={[-4.1, 5.1, at(1) - 4]} phase={2.6} />
      <Lantern position={[4.5, 4.9, at(2) - 11]} phase={0.9} />
      <Lantern position={[-4.3, 5.2, at(3) - 4]} phase={3.4} />
      <Lantern position={[4.2, 5, at(4) - 10]} phase={1.2} />

      {/* 0 — Hero: the big steaming bowl, orbited by noodle rings */}
      <group position={[0, 0, at(0)]}>
        <group position={[0, 1.9, -2.5]}>
          <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.5}>
            <HeroBowl />
          </Float>
        </group>
        <NoodleRing position={[-3.4, 2.6, -1]} radius={0.55} tube={0.18} />
        <NoodleRing position={[3.6, 1.4, -0.5]} radius={0.45} tube={0.15} speed={0.6} />
        <Chopsticks position={[-2.6, 0.9, 0.5]} rotation={[0.3, 0.6, 0.2]} />
        <Sparkles count={80} scale={[10, 6, 7]} position={[0, 3, -2]} size={2.4} speed={0.3} color={RED} opacity={0.55} />
      </group>

      {/* 1 — Manifesto: a stack of noodle rings, time made visible */}
      <group position={[2.8, 0, at(1)]}>
        <NoodleRing position={[0, 3.4, -1]} radius={0.85} tube={0.26} speed={0.3} />
        <NoodleRing position={[-0.6, 1.8, 0]} radius={0.6} tube={0.2} speed={0.5} />
        <NoodleRing position={[0.9, 1.1, 0.6]} radius={0.4} tube={0.14} speed={0.7} />
        <Chopsticks position={[-1.8, 2.2, -0.6]} rotation={[0.2, -0.4, 0.5]} />
      </group>

      {/* 2 — Menu: four signature bowls, each grows on hover */}
      <group position={[0, 0, at(2)]}>
        <MenuBowl position={[-4.6, 1.5, -1]} name="Kaiju Shoyu" price="14 €" brothColor="#c46a1e" />
        <MenuBowl position={[-1.6, 1.2, 0]} name="Volcano Tonkotsu" price="16 €" brothColor="#ff5a2e" />
        <MenuBowl position={[1.6, 1.2, 0]} name="Neon Paitan" price="15 €" brothColor="#ffd9a8" />
        <MenuBowl position={[4.6, 1.5, -1]} name="Midnight Gojira" price="13 €" brothColor="#8a5cff" />
      </group>

      {/* 3 — The bar: counter, stools, neon */}
      <TheBar z={at(3)} />

      {/* 4 — Chef: one pot, endless steam */}
      <ChefPot z={at(4)} />
      <Chopsticks position={[-3.2, 2.4, at(4) - 1]} rotation={[0.4, 0.3, -0.3]} />

      {/* 5 — Reservations: the lantern run pulls you in */}
      <group position={[0, 0, at(5)]}>
        <LanternRun z={-1} />
        <NoodleRing position={[0, 2.2, -4]} radius={1.05} tube={0.3} speed={0.25} />
        <Sparkles count={110} scale={[10, 6, 9]} position={[0, 3, -4]} size={2.2} speed={0.3} color={PINK} opacity={0.6} />
      </group>

      {/* 6 — Footer: the alley fades out under a last pair of lanterns */}
      <group position={[0, 0, at(6)]}>
        <Lantern position={[-2.6, 5, -3]} phase={0.7} />
        <Lantern position={[2.6, 5.2, -3.8]} phase={2.2} />
        <group position={[0, 1.1, -4]} scale={0.9}>
          <Bowl steam={false} />
        </group>
        <Sparkles count={70} scale={[9, 5, 7]} position={[0, 2.6, -4]} size={2} speed={0.25} color={AMBER} opacity={0.5} />
      </group>

      <EffectComposer>
        <Bloom intensity={0.65} luminanceThreshold={0.25} luminanceSmoothing={0.7} mipmapBlur />
        <Noise opacity={0.05} />
        <Vignette offset={0.15} darkness={0.86} />
      </EffectComposer>
    </>
  )
}
