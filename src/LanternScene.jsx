import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars, Html, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { glowTexture } from './Scene'
import { sections } from './content'
import {
  mulberry32,
  castleWallTexture,
  castleWallBump,
  islandTexture,
  islandBump,
  waterNoiseTexture,
  lanternPaperTexture,
  milkyWayTexture,
  displacedSphereGeometry,
  rockGeometry,
} from './proceduralTextures'

// ---------------- shader water: scrolling noise, fresnel, moon glints ----------------
const WATER_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vUv2;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vUv2 = position.xy * 0.008; // local plane coords, world-scale tiling
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  uniform vec3 uMoonDir;
  varying vec3 vWorld;
  varying vec2 vUv2;
  #include <fog_pars_fragment>
  void main() {
    // two layers of scrolling noise at different scales & speeds
    float n1 = texture2D(uNoise, vUv2 * 6.0 + vec2(uTime * 0.020, uTime * 0.012)).r;
    float n2 = texture2D(uNoise, vUv2 * 19.0 - vec2(uTime * 0.055, uTime * 0.024)).r;
    float h = n1 * 0.65 + n2 * 0.35;
    vec3 n = normalize(vec3((n1 - 0.5) * 0.55 + (n2 - 0.5) * 0.3, 1.0, (n2 - 0.5) * 0.55));

    vec3 V = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(dot(V, n), 0.0), 3.0);

    vec3 deep = vec3(0.020, 0.042, 0.120);
    vec3 sky  = vec3(0.110, 0.150, 0.330);
    vec3 col = mix(deep, sky, fres * 0.95);

    // moonlight specular path
    vec3 H = normalize(normalize(uMoonDir) + V);
    float spec = pow(max(dot(n, H), 0.0), 160.0);
    col += vec3(0.75, 0.82, 1.0) * spec * 1.4;

    // warm lantern sparkles riding the ripples
    float sparkle = smoothstep(0.74, 0.94, n2) * smoothstep(0.55, 0.85, n1);
    col += vec3(1.0, 0.58, 0.22) * sparkle * (0.10 + fres * 0.25);

    // ripple shading
    col *= 0.85 + h * 0.30;

    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`

function Water() {
  const mat = useRef()
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })
  const uniforms = useMemo(
    () => ({
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: { value: 0 },
      uNoise: { value: waterNoiseTexture() },
      uMoonDir: { value: new THREE.Vector3(-0.45, 0.55, -0.55).normalize() },
    }),
    [],
  )
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[480, 64]} />
      <shaderMaterial
        ref={mat}
        vertexShader={WATER_VERT}
        fragmentShader={WATER_FRAG}
        uniforms={uniforms}
        fog
      />
    </mesh>
  )
}

// glowing embers drifting up around the boat
function Embers() {
  const { camera } = useThree()
  const root = useRef()
  const pts = useRef()
  const seeds = useMemo(() => {
    const n = 130
    const rand = mulberry32(77)
    return Array.from({ length: n }, () => ({
      x: (rand() - 0.5) * 46,
      y: 0.4 + rand() * 8,
      z: (rand() - 0.5) * 46,
      rise: 0.25 + rand() * 0.5,
      sway: rand() * Math.PI * 2,
    }))
  }, [])
  const positions = useMemo(() => new Float32Array(seeds.length * 3), [seeds])
  useFrame(({ clock }, dt) => {
    if (root.current) root.current.position.set(camera.position.x, 0, camera.position.z)
    const t = clock.elapsedTime
    const attr = pts.current?.geometry.attributes.position
    if (!attr) return
    seeds.forEach((s, i) => {
      s.y += s.rise * dt
      if (s.y > 9) s.y = 0.3
      attr.setXYZ(i, s.x + Math.sin(t * 0.6 + s.sway) * 1.4, s.y, s.z)
    })
    attr.needsUpdate = true
  })
  return (
    <group ref={root}>
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.22}
          color="#ffc27e"
          transparent
          opacity={0.8}
          map={glowTexture()}
          alphaTest={0.01}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

// faint milky-way band across the night sky
function MilkyWay() {
  return (
    <mesh position={[80, 130, -320]} rotation={[0, 0.25, 0.4]}>
      <planeGeometry args={[760, 190]} />
      <meshBasicMaterial
        map={milkyWayTexture()}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ============================================================
// The forbidden-button easter egg: a Tangled-style lantern night.
// POV from a rowboat, lanterns rising everywhere, castle across
// the water. The five dossiers hide in lanterns & boat trinkets.
// ============================================================

const texCache = {}

function crescentTexture() {
  if (texCache.crescent) return texCache.crescent
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fdf6e0'
  ctx.beginPath()
  ctx.arc(64, 64, 48, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(88, 52, 44, 0, Math.PI * 2)
  ctx.fill()
  return (texCache.crescent = new THREE.CanvasTexture(c))
}

// rippling wave pattern for the lake surface
function waterTexture() {
  if (texCache.water) return texCache.water
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#101c40'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 240; i++) {
    const y = Math.random() * 256
    const x = Math.random() * 256
    const len = 20 + Math.random() * 60
    ctx.strokeStyle =
      Math.random() > 0.45 ? 'rgba(78,116,200,0.14)' : 'rgba(6,10,26,0.25)'
    ctx.lineWidth = 1 + Math.random() * 1.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + len / 2, y + (Math.random() - 0.5) * 6, x + len, y)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(10, 10)
  return (texCache.water = t)
}

// one glowing paper lantern: gradient paper with baked ribs & seams,
// brightest at the flame. `detailed` adds real rim rings for close-ups.
function LanternBody({ scale = 1, glow = 0.35, detailed = false }) {
  return (
    <group scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.42, 0.85, 12]} />
        <meshStandardMaterial
          map={lanternPaperTexture()}
          emissiveMap={lanternPaperTexture()}
          emissive="#ffb054"
          emissiveIntensity={1.35}
          color="#e8b070"
          roughness={0.9}
        />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.12, 8]} />
        <meshStandardMaterial color="#5a3b1e" roughness={1} />
      </mesh>
      {detailed && (
        <>
          <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.022, 6, 18]} />
            <meshStandardMaterial color="#4a2c10" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.022, 6, 18]} />
            <meshStandardMaterial color="#4a2c10" roughness={0.9} />
          </mesh>
          {/* the flame itself */}
          <mesh position={[0, -0.28, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#fff4cc" emissive="#ffedb0" emissiveIntensity={4} toneMapped={false} />
          </mesh>
        </>
      )}
      <sprite scale={[2.6, 2.6, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffb45e"
          transparent
          opacity={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}

// the sky full of rising lanterns
function SkyLanterns() {
  const group = useRef()
  const lanterns = useMemo(
    () =>
      Array.from({ length: 270 }, () => ({
        x: (Math.random() - 0.5) * 420,
        y: 2 + Math.random() * 165,
        z: (Math.random() - 0.5) * 420 - 40,
        s: 0.45 + Math.random() * 1.15,
        rise: 1.3 + Math.random() * 2.4,
        sway: Math.random() * Math.PI * 2,
      })),
    [],
  )
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    group.current.children.forEach((l, i) => {
      const L = lanterns[i]
      l.position.y += L.rise * dt
      if (l.position.y > 175) l.position.y = 2
      l.position.x = L.x + Math.sin(t * 0.7 + L.sway) * 4
      l.rotation.y = Math.sin(t * 0.5 + L.sway) * 0.5
      l.rotation.z = Math.sin(t * 0.6 + L.sway) * 0.12
    })
  })
  return (
    <group ref={group}>
      {lanterns.map((L, i) => (
        <group key={i} position={[L.x, L.y, L.z]}>
          <LanternBody scale={L.s} glow={0.4} />
        </group>
      ))}
    </group>
  )
}

// decorative lanterns drifting ON the water, bobbing with the swell
function SeaLanterns() {
  const group = useRef()
  const items = useMemo(
    () =>
      Array.from({ length: 75 }, () => ({
        x: (Math.random() - 0.5) * 330,
        z: (Math.random() - 0.5) * 330 - 30,
        s: 0.4 + Math.random() * 0.55,
        ph: Math.random() * Math.PI * 2,
      })),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((l, i) => {
      l.position.y = 0.75 + Math.sin(t * 1.1 + items[i].ph) * 0.3
      l.rotation.z = Math.sin(t * 0.9 + items[i].ph) * 0.13
    })
  })
  return (
    <group ref={group}>
      {items.map((L, i) => (
        <group key={i} position={[L.x, 0.7, L.z]}>
          <LanternBody scale={L.s} glow={0.45} />
        </group>
      ))}
    </group>
  )
}

// hundreds of far-away lanterns, rendered cheaply as glowing points —
// makes the night feel endless, like the whole kingdom released them
function DistantLanterns() {
  const ref = useRef()
  const [positions, colors] = useMemo(() => {
    const n = 700
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const palette = ['#ffb45e', '#ff9a2e', '#ffd98a', '#ff8a4a'].map((c) => new THREE.Color(c))
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 240 + Math.random() * 200
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 4 + Math.pow(Math.random(), 1.6) * 150
      pos[i * 3 + 2] = Math.sin(a) * r - 40
      const c = palette[i % palette.length]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [])
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.002))
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        vertexColors
        transparent
        opacity={0.85}
        map={glowTexture()}
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// low mist drifting over the lake
function Mist() {
  const group = useRef()
  const banks = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        pos: [(Math.random() - 0.5) * 340, 2.5 + Math.random() * 4, (Math.random() - 0.5) * 340 - 40],
        s: 60 + Math.random() * 90,
        o: 0.035 + Math.random() * 0.035,
        drift: 1.2 + Math.random() * 1.8,
      })),
    [],
  )
  useFrame((_, dt) => {
    group.current.children.forEach((m, i) => {
      m.position.x += banks[i].drift * dt
      if (m.position.x > 260) m.position.x = -260
    })
  })
  return (
    <group ref={group}>
      {banks.map((m, i) => (
        <sprite key={i} position={m.pos} scale={[m.s, m.s * 0.18, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color="#8a9ad0"
            transparent
            opacity={m.o}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// warm shimmering reflections on the water
function WaterGlints() {
  const group = useRef()
  const glints = useMemo(
    () =>
      Array.from({ length: 150 }, () => ({
        pos: [(Math.random() - 0.5) * 380, 0.15, (Math.random() - 0.5) * 380 - 40],
        s: 2 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
        base: 0.05 + Math.random() * 0.11,
      })),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((g, i) => {
      g.material.opacity = glints[i].base * (0.4 + 0.6 * Math.sin(t * 2.4 + glints[i].phase))
    })
  })
  return (
    <group ref={group}>
      {glints.map((g, i) => (
        <sprite key={i} position={g.pos} scale={[g.s, g.s * 0.35, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color="#ffb45e"
            transparent
            opacity={g.base}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// soft violet-blue haze and twinkling bright stars for a painted night sky
function NightSky() {
  const twinkles = useRef()
  const hazes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        pos: [
          Math.cos((i / 12) * Math.PI * 2) * 340,
          50 + Math.random() * 130,
          Math.sin((i / 12) * Math.PI * 2) * 340 - 40,
        ],
        s: 190 + Math.random() * 150,
        color: ['#3d4fa0', '#6a4fb8', '#2a3f8f', '#8a4fa0', '#b06a8a', '#ffb45e'][i % 6],
        o: i % 6 === 5 ? 0.05 : 0.08 + Math.random() * 0.06,
      })),
    [],
  )
  const bright = useMemo(
    () =>
      Array.from({ length: 26 }, () => ({
        pos: [(Math.random() - 0.5) * 500, 80 + Math.random() * 160, (Math.random() - 0.5) * 500 - 60],
        s: 1.6 + Math.random() * 2.6,
        ph: Math.random() * Math.PI * 2,
      })),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    twinkles.current.children.forEach((s, i) => {
      s.material.opacity = 0.15 + 0.85 * Math.abs(Math.sin(t * 2.4 + bright[i].ph))
    })
  })
  return (
    <>
      {hazes.map((h, i) => (
        <sprite key={i} position={h.pos} scale={[h.s, h.s * 0.7, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color={h.color}
            transparent
            opacity={h.o}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
      <group ref={twinkles}>
        {bright.map((b, i) => (
          <sprite key={i} position={b.pos} scale={[b.s, b.s, 1]}>
            <spriteMaterial
              map={glowTexture()}
              color="#eef2ff"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        ))}
      </group>
    </>
  )
}

// distant sailing ships, dark silhouettes with warm deck lamps
function Ships() {
  const group = useRef()
  const ships = useMemo(
    () => [
      { p: [-130, 0, -150], r: 0.6, s: 7 },
      { p: [150, 0, -130], r: -0.4, s: 6 },
      { p: [-190, 0, -50], r: 1.2, s: 5.5 },
      { p: [180, 0, -30], r: -1.0, s: 8 },
      { p: [-95, 0, -215], r: 0.2, s: 6 },
      { p: [110, 0, -195], r: -0.7, s: 5 },
    ],
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((s, i) => {
      s.position.y = Math.sin(t * 0.7 + i * 1.7) * 0.8
      s.rotation.z = Math.sin(t * 0.55 + i) * 0.05
    })
  })
  return (
    <group ref={group}>
      {ships.map((sh, i) => (
        <group key={i} position={sh.p} rotation={[0, sh.r, 0]} scale={sh.s}>
          <mesh position={[0, 0.25, 0]} scale={[0.5, 0.3, 1.7]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#151b32" roughness={1} />
          </mesh>
          <mesh position={[0, 1.5, -0.3]}>
            <cylinderGeometry args={[0.04, 0.06, 2.6, 6]} />
            <meshStandardMaterial color="#10152a" roughness={1} />
          </mesh>
          <mesh position={[0, 1.3, 0.9]}>
            <cylinderGeometry args={[0.03, 0.05, 1.9, 6]} />
            <meshStandardMaterial color="#10152a" roughness={1} />
          </mesh>
          <mesh position={[0, 1.6, -0.28]}>
            <planeGeometry args={[1.2, 1.5]} />
            <meshStandardMaterial color="#1d2545" roughness={1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.35, 0.92]}>
            <planeGeometry args={[0.9, 1.1]} />
            <meshStandardMaterial color="#1d2545" roughness={1} side={THREE.DoubleSide} />
          </mesh>
          {/* deck and mast lamps */}
          <sprite position={[0, 0.75, 0]} scale={[1.3, 1.3, 1]}>
            <spriteMaterial map={glowTexture()} color="#ffb45e" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
          <sprite position={[0, 2.8, -0.3]} scale={[0.8, 0.8, 1]}>
            <spriteMaterial map={glowTexture()} color="#ffd98a" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
          {/* reflection on the water */}
          <sprite position={[0, 0.1, 0]} scale={[3, 0.8, 1]}>
            <spriteMaterial map={glowTexture()} color="#ffb45e" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        </group>
      ))}
    </group>
  )
}

// Corona castle on its island: towers, walls, turrets, lit windows, beacon
function Castle() {
  const towers = useMemo(
    () => [
      { p: [0, 0, 0], r: 7, h: 46 },
      { p: [-12, 0, 4], r: 4.5, h: 26 },
      { p: [11, 0, 3], r: 4.5, h: 30 },
      { p: [-7, 0, -6], r: 3.5, h: 34 },
      { p: [7, 0, -7], r: 3.5, h: 22 },
      { p: [-17, 0, -2], r: 3, h: 18 },
      { p: [17, 0, -3], r: 3, h: 16 },
      { p: [-5, 0, 8], r: 2.5, h: 14 },
      { p: [5, 0, 9], r: 2.5, h: 15 },
      { p: [-14, 0, -9], r: 2.5, h: 21 },
      { p: [14, 0, -10], r: 2.5, h: 19 },
      { p: [-9, 0, 10], r: 2, h: 11 },
      { p: [9, 0, 11], r: 2, h: 12 },
    ],
    [],
  )
  const windows = useMemo(
    () =>
      Array.from({ length: 170 }, () => {
        const t = towers[Math.floor(Math.random() * towers.length)]
        return {
          pos: [
            t.p[0] + (Math.random() - 0.5) * t.r * 1.6,
            4 + Math.random() * (t.h - 4),
            t.p[2] + t.r * 0.9,
          ],
          s: 0.7 + Math.random() * 1,
        }
      }),
    [towers],
  )
  const bridgeLamps = useMemo(
    () => Array.from({ length: 7 }, (_, i) => [34 + i * 11, 12.5, 8]),
    [],
  )
  const islandGeo = useMemo(() => displacedSphereGeometry(23, 0.12), [])
  const rockGeos = useMemo(() => [rockGeometry(3), rockGeometry(8), rockGeometry(15)], [])
  const rocks = useMemo(() => {
    const rand = mulberry32(55)
    return Array.from({ length: 14 }, (_, i) => {
      const a = rand() * Math.PI * 2
      const d = 30 + rand() * 20
      return {
        pos: [Math.cos(a) * d, 6 + rand() * 3, Math.sin(a) * d * 0.72],
        s: 1.6 + rand() * 3.4,
        rot: rand() * Math.PI * 2,
        geo: i % 3,
      }
    })
  }, [])
  const cypresses = useMemo(() => {
    const rand = mulberry32(66)
    return Array.from({ length: 7 }, () => {
      const a = rand() * Math.PI * 2
      const d = 24 + rand() * 14
      return {
        pos: [Math.cos(a) * d, 9 + rand() * 2, Math.sin(a) * d * 0.7],
        h: 5 + rand() * 4,
      }
    })
  }, [])
  // gentle colour variation so the towers don't look cloned
  const towerTints = ['#a8b0d8', '#b8b2c8', '#9aa8d0', '#b0a8c0']
  const winDummy = useMemo(() => new THREE.Object3D(), [])
  return (
    <group position={[0, 0, -230]} scale={1.55}>
      {/* island rock — noisy silhouette, darker at the waterline */}
      <mesh geometry={islandGeo} position={[0, -2, 0]} scale={[46, 15, 32]}>
        <meshStandardMaterial map={islandTexture()} bumpMap={islandBump()} bumpScale={0.8} roughness={0.92} />
      </mesh>
      {/* scattered rocks & cypress trees around the base */}
      {rocks.map((r, i) => (
        <mesh key={`r${i}`} geometry={rockGeos[r.geo]} position={r.pos} scale={r.s} rotation={[0, r.rot, 0]}>
          <meshStandardMaterial map={islandTexture()} bumpMap={islandBump()} bumpScale={0.6} roughness={0.95} />
        </mesh>
      ))}
      {cypresses.map((cp, i) => (
        <mesh key={`c${i}`} position={cp.pos}>
          <coneGeometry args={[1.3, cp.h, 8]} />
          <meshStandardMaterial color="#141d40" roughness={1} />
        </mesh>
      ))}
      {/* curtain walls */}
      <mesh position={[0, 11, 7]}>
        <boxGeometry args={[34, 9, 2.5]} />
        <meshStandardMaterial color="#272d58" roughness={0.95} />
      </mesh>
      <mesh position={[-16, 11, 0]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[16, 8, 2.5]} />
        <meshStandardMaterial color="#272d58" roughness={0.95} />
      </mesh>
      <mesh position={[16, 11, 0]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[16, 8, 2.5]} />
        <meshStandardMaterial color="#272d58" roughness={0.95} />
      </mesh>
      {/* towers: weathered plaster, roof trim, gilded spire tips */}
      {towers.map((t, i) => (
        <group key={i} position={t.p}>
          <mesh position={[0, t.h / 2 + 8, 0]}>
            <cylinderGeometry args={[t.r, t.r * 1.15, t.h, 24]} />
            <meshStandardMaterial
              map={castleWallTexture()}
              bumpMap={castleWallBump()}
              bumpScale={0.5}
              color={towerTints[i % towerTints.length]}
              roughness={0.85}
            />
          </mesh>
          {/* trim ring where the roof meets the tower */}
          <mesh position={[0, t.h + 8 - 0.2, 0]}>
            <cylinderGeometry args={[t.r * 1.28, t.r * 1.28, 0.55, 24]} />
            <meshStandardMaterial color="#454f88" roughness={0.8} />
          </mesh>
          <mesh position={[0, t.h + 8 + t.r * 0.9, 0]}>
            <coneGeometry args={[t.r * 1.3, t.r * 2.2, 24]} />
            <meshStandardMaterial
              map={castleWallTexture()}
              bumpMap={castleWallBump()}
              bumpScale={0.4}
              color="#7a6aa8"
              roughness={0.85}
            />
          </mesh>
          <sprite position={[0, t.h + 8 + t.r * 2.1, 0]} scale={[1.6, 1.6, 1]}>
            <spriteMaterial
              map={glowTexture()}
              color="#ffe0a0"
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </group>
      ))}

      {/* the long bridge to shore, dotted with lamps */}
      <mesh position={[62, 9.5, 8]}>
        <boxGeometry args={[76, 3, 5]} />
        <meshStandardMaterial color="#232a52" roughness={0.95} />
      </mesh>
      {bridgeLamps.map((p, i) => (
        <sprite key={i} position={p} scale={[2.4, 2.4, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color="#ffcf82"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
      {/* lit windows: real emissive openings, one instanced draw call */}
      <instancedMesh
        args={[undefined, undefined, windows.length]}
        ref={(m) => {
          if (!m) return
          windows.forEach((w, i) => {
            winDummy.position.set(w.pos[0], w.pos[1], w.pos[2])
            winDummy.scale.set(w.s * 0.42, w.s * 0.7, 1)
            winDummy.rotation.set(0, 0, 0)
            winDummy.updateMatrix()
            m.setMatrixAt(i, winDummy.matrix)
          })
          m.instanceMatrix.needsUpdate = true
        }}
      >
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial
          color="#2a1a06"
          emissive="#ffca6a"
          emissiveIntensity={2.6}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      {/* beacon atop the main spire */}
      <sprite position={[0, 66, 0]} scale={[9, 9, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffe8b0"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      {/* the town's warm glow at the waterline */}
      <sprite position={[0, 6, 14]} scale={[150, 44, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ff9a4e"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      {/* castle light spilling across the water toward you */}
      <sprite position={[0, 1.2, 55]} scale={[70, 14, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffab5e"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite position={[0, 30, 0]} scale={[100, 100, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#b78aff"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}

function MiniLabel({ y, id, text, onSelect }) {
  return (
    <Html position={[0, y, 0]} transform sprite distanceFactor={1.5} zIndexRange={[30, 0]} style={{ pointerEvents: 'auto' }}>
      <button
        className="lantern-label"
        onClick={(e) => {
          e.stopPropagation()
          onSelect(id)
        }}
      >
        <i className="lantern-label-num">{sections[id].num}</i> {text}
      </button>
    </Html>
  )
}

// Clickable treasure: pulses with an inviting glow until discovered.
// Its name appears when you look toward it (gaze) or hover the mouse on it.
function Clickable({ id, onSelect, found, children, radius = 1.2, labelY = 1.4, pulseScale = 3 }) {
  const [hover, setHover] = useState(false)
  const [gaze, setGaze] = useState(false)
  const pulse = useRef()
  const pulse2 = useRef()
  const anchor = useRef()
  const toObj = useRef(new THREE.Vector3())
  const lookDir = useRef(new THREE.Vector3())
  useFrame(({ camera, clock }) => {
    if (pulse.current && pulse2.current) {
      if (found) {
        // discovered treasures keep a soft breathing ember, so everything
        // clickable still reads as alive — just calmer than the unvisited
        const breathe = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.1)
        pulse.current.material.opacity = 0.14 + 0.1 * breathe
        const sf = pulseScale * (0.85 + breathe * 0.08)
        pulse.current.scale.set(sf, sf, 1)
        pulse2.current.material.opacity = 0.1 + 0.06 * breathe
        const sf2 = pulseScale * 0.5
        pulse2.current.scale.set(sf2, sf2, 1)
      } else {
        // hard double-beat so unvisited treasures clearly call for a click
        const k = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.4)
        pulse.current.material.opacity = 0.3 + 0.6 * k
        const s = pulseScale * (1 + k * 0.6)
        pulse.current.scale.set(s, s, 1)
        const k2 = 1 - k
        pulse2.current.material.opacity = 0.2 + 0.55 * k2
        const s2 = pulseScale * 0.55 * (1 + k2 * 0.5)
        pulse2.current.scale.set(s2, s2, 1)
      }
    }
    // gaze check: close enough and roughly in the middle of your view
    if (anchor.current) {
      anchor.current.getWorldPosition(toObj.current)
      toObj.current.sub(camera.position)
      const dist = toObj.current.length()
      camera.getWorldDirection(lookDir.current)
      const facing = toObj.current.normalize().dot(lookDir.current)
      const looking = dist < 18 && facing > (dist < 5 ? 0.82 : 0.93)
      if (looking !== gaze) setGaze(looking)
    }
  })
  return (
    <group ref={anchor}>
      {children}
      <sprite ref={pulse} scale={[pulseScale, pulseScale, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffe9b0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite ref={pulse2} scale={[pulseScale * 0.55, pulseScale * 0.55, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      {(hover || gaze) && (
        <MiniLabel y={labelY} id={id} text={sections[id].label} onSelect={onSelect} />
      )}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(id)
        }}
        onPointerOver={() => {
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <sphereGeometry args={[radius, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// the three message lanterns float ON the water at fixed spots near the boat
function TreasureLanterns({ onSelect, discovered = [] }) {
  const refs = useRef([])
  const spots = useMemo(
    () => [
      { id: 'galaxy', p: [-7, 0.9, 28] },
      { id: 'saturn', p: [8, 0.9, 24] },
      { id: 'moon', p: [1.5, 0.9, 13] }, // floats on the water dead ahead
    ],
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((r, i) => {
      if (r) r.position.y = Math.sin(t * 1.2 + i * 2.1) * 0.35
    })
  })
  return spots.map((s, i) => (
    <group key={s.id} position={s.p}>
      <group ref={(el) => (refs.current[i] = el)}>
        <Clickable
          id={s.id}
          onSelect={onSelect}
          found={discovered.includes(s.id)}
          radius={1.5}
          labelY={1.7}
          pulseScale={3.4}
        >
          <LanternBody scale={1.05} glow={0.5} detailed />
        </Clickable>
      </group>
    </group>
  ))
}

// the rowboat you stand in — glides with you but keeps its own heading
function Boat({ onSelect, discovered = [] }) {
  const { camera } = useThree()
  const root = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!root.current) return
    root.current.position.set(camera.position.x, Math.sin(t * 0.9) * 0.14, camera.position.z)
    root.current.rotation.z = Math.sin(t * 0.7) * 0.035
  })

  const wood = { color: '#5e3820', roughness: 0.85 }
  const trim = { color: '#8a2f2f', roughness: 0.8 }

  return (
    <group ref={root}>
      {/* hull */}
      <mesh position={[0, 0.62, 0]} scale={[1.5, 0.5, 3.3]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[1.7, 0.12, 4.6]} />
        <meshStandardMaterial {...trim} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.35, 0.06, 4.2]} />
        <meshStandardMaterial color="#7a4a28" roughness={0.9} />
      </mesh>
      {/* bow post with its lamp, low enough to see past */}
      <mesh position={[0, 1.25, -2.35]}>
        <cylinderGeometry args={[0.07, 0.1, 0.7, 8]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      <group position={[0, 1.75, -2.35]}>
        <LanternBody scale={0.45} glow={0.4} detailed />
      </group>
      <pointLight position={[0, 1.8, -2.3]} intensity={1.2} color="#ffb45e" decay={1} distance={9} />

      {/* her journal on the boat floor — open it to read who she is */}
      <group position={[-0.55, 1.1, -1.45]} rotation={[0, 0.5, 0]}>
        <Clickable
          id="sun"
          onSelect={onSelect}
          found={discovered.includes('sun')}
          radius={0.5}
          labelY={0.9}
          pulseScale={1.5}
        >
          <mesh>
            <boxGeometry args={[0.55, 0.12, 0.75]} />
            <meshStandardMaterial color="#8a3030" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.065, 0]}>
            <boxGeometry args={[0.5, 0.015, 0.7]} />
            <meshStandardMaterial color="#e8c76a" emissive="#e8a94a" emissiveIntensity={0.6} />
          </mesh>
        </Clickable>
      </group>

      {/* the glowing golden flower in a basket, up front by the bow */}
      <group position={[0.6, 1.15, -0.85]}>
        <Clickable
          id="jupiter"
          onSelect={onSelect}
          found={discovered.includes('jupiter')}
          radius={0.5}
          labelY={1.0}
          pulseScale={1.7}
        >
          <mesh>
            <cylinderGeometry args={[0.38, 0.28, 0.3, 10]} />
            <meshStandardMaterial color="#a67c46" roughness={1} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshStandardMaterial color="#ffe89a" emissive="#ffd452" emissiveIntensity={2.4} />
          </mesh>
          <sprite position={[0, 0.3, 0]} scale={[1.4, 1.4, 1]}>
            <spriteMaterial
              map={glowTexture()}
              color="#ffe08a"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </Clickable>
      </group>
    </group>
  )
}

export default function LanternScene({ onSelect, discovered = [] }) {
  return (
    <>
      <color attach="background" args={['#131a3d']} />
      <fogExp2 attach="fog" args={['#1a2350', 0.0028]} />
      {/* procedural environment: warm town glow + cool moonlight, so
          materials pick up believable reflections (no external files) */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#0d1330']} />
        <Lightformer intensity={1.6} color="#ffb45e" position={[0, 2, -9]} scale={[14, 3, 1]} />
        <Lightformer intensity={1.8} color="#cfe0ff" position={[-7, 9, -3]} scale={2.4} form="circle" />
        <Lightformer intensity={0.7} color="#6a5bb8" position={[8, 6, 6]} scale={[8, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.32} color="#8a96d8" />
      <directionalLight position={[-80, 120, 40]} intensity={0.5} color="#aebbf0" />
      <Stars radius={420} depth={80} count={7000} factor={5} saturation={0} fade speed={0.4} />
      <NightSky />

      {/* crescent moon */}
      <sprite position={[-140, 150, -200]} scale={[26, 26, 1]}>
        <spriteMaterial map={crescentTexture()} transparent opacity={0.95} depthWrite={false} />
      </sprite>
      <sprite position={[-140, 150, -200]} scale={[60, 60, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#dfe6ff"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* the water: custom shader — scrolling ripples, fresnel, moon glints */}
      <Water />

      <MilkyWay />
      <Embers />
      <WaterGlints />
      <Mist />
      <SeaLanterns />
      <SkyLanterns />
      <DistantLanterns />
      <Ships />
      <Castle />
      <TreasureLanterns onSelect={onSelect} discovered={discovered} />
      <Boat onSelect={onSelect} discovered={discovered} />
    </>
  )
}
