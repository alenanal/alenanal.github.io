import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Stars, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { glowTexture } from './Scene'
import { mulberry32, brushedMetalTexture } from './proceduralTextures'

// ---------- little canvas textures for the ground world ----------
const texCache = {}
function canvasTex(key, w, h, draw, repeat) {
  if (texCache[key]) return texCache[key]
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (repeat) t.repeat.set(repeat, repeat)
  return (texCache[key] = t)
}

function grassTexture() {
  return canvasTex(
    'grass',
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#559a4a'
      ctx.fillRect(0, 0, w, h)
      const tones = ['#4d8f42', '#61a854', '#6fb35f', '#478540', '#7abd68']
      for (let i = 0; i < 480; i++) {
        ctx.fillStyle = tones[i % tones.length]
        ctx.globalAlpha = 0.25
        const r = 4 + Math.random() * 18
        ctx.beginPath()
        ctx.ellipse(Math.random() * w, Math.random() * h, r, r * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 0.5
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#3d7a36' : '#8cc97a'
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 2.6)
      }
      ctx.globalAlpha = 1
    },
    26,
  )
}

function foliageTexture() {
  return canvasTex('foliage', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

function barkTexture() {
  return canvasTex('bark', 64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#6b4a2e'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(40,24,12,0.4)' : 'rgba(140,102,66,0.35)'
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 10 + Math.random() * 40)
    }
  })
}

// ---------------------------------------------------------------------------
// Trees: layered conifers + round leafy trees in varied colours, gently swaying
// ---------------------------------------------------------------------------
const CONIFER_GREENS = ['#2f7a35', '#3c8a3f', '#27692e', '#39804d']
const LEAFY_COLORS = ['#4a9648', '#5aab4f', '#63a83a', '#3f8f45']

function Conifer({ color, s }) {
  return (
    <group scale={s}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.45, 0.7, 3.2, 7]} />
        <meshStandardMaterial map={barkTexture()} color="#a8825e" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 3.6 + i * 2.1, 0]} rotation={[0, i * 0.7, 0]}>
          <coneGeometry args={[3.4 - i * 0.9, 3.4, 9]} />
          <meshStandardMaterial map={foliageTexture()} color={color} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function LeafyTree({ color, s }) {
  const blobs = useMemo(
    () =>
      Array.from({ length: 5 }, () => [
        (Math.random() - 0.5) * 2.6,
        4.6 + (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 2.6,
      ]),
    [],
  )
  return (
    <group scale={s}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.42, 0.65, 4, 7]} />
        <meshStandardMaterial map={barkTexture()} color="#9a7450" roughness={1} />
      </mesh>
      {blobs.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[1.7 + (i % 3) * 0.4, 10, 10]} />
          <meshStandardMaterial map={foliageTexture()} color={color} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// thousands of individual grass blades, swaying in the wind — one draw call
function GrassField({ tint }) {
  const COUNT = 5200
  const mesh = useRef()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.16, 1.15, 1, 3)
    g.translate(0, 0.575, 0) // pivot at the root
    return g
  }, [])
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: tint, roughness: 1, side: THREE.DoubleSide })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.vertexShader =
        'uniform float uTime;\nvarying float vGrassY;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `vec3 transformed = vec3(position);
           vGrassY = position.y;
           #ifdef USE_INSTANCING
             vec2 ip = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
             float k = position.y * position.y;
             transformed.x += sin(uTime * 1.7 + ip.x * 0.35 + ip.y * 0.25) * 0.22 * k;
             transformed.z += cos(uTime * 1.35 + ip.x * 0.21 + ip.y * 0.33) * 0.16 * k;
           #endif`,
        )
      shader.fragmentShader =
        'varying float vGrassY;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           diffuseColor.rgb *= mix(vec3(0.42, 0.58, 0.40), vec3(1.10, 1.14, 0.95), clamp(vGrassY, 0.0, 1.0));`,
        )
      m.userData.shader = shader
    }
    return m
  }, [tint])
  useFrame((_, dt) => {
    const s = material.userData.shader
    if (s) s.uniforms.uTime.value += dt
  })
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const rand = mulberry32(123)
    for (let i = 0; i < COUNT; i++) {
      const a = rand() * Math.PI * 2
      const d = 5 + Math.pow(rand(), 0.8) * 235
      dummy.position.set(Math.cos(a) * d, 0, Math.sin(a) * d)
      dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI, (rand() - 0.5) * 0.25)
      const s = 0.6 + rand() * 0.95
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [material])
  return <instancedMesh ref={mesh} args={[geo, material, COUNT]} frustumCulled={false} />
}

// birds: little flapping silhouettes circling the sky
function Birds() {
  const flock = useRef([])
  const birds = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        r: 60 + Math.random() * 110,
        h: 30 + Math.random() * 34,
        speed: 0.25 + Math.random() * 0.18,
        phase: (i / 9) * Math.PI * 2,
        flap: 8 + Math.random() * 5,
      })),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    birds.forEach((b, i) => {
      const g = flock.current[i]
      if (!g) return
      const a = b.phase + t * b.speed
      g.position.set(Math.cos(a) * b.r, b.h + Math.sin(t * 1.1 + b.phase) * 6, Math.sin(a) * b.r)
      g.rotation.y = -a - Math.PI / 2
      const flap = Math.sin(t * b.flap) * 0.9
      g.children[0].rotation.z = flap
      g.children[1].rotation.z = -flap
    })
  })
  return birds.map((b, i) => (
    <group key={i} ref={(el) => (flock.current[i] = el)}>
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[1.2, 0.06, 0.34]} />
        <meshStandardMaterial color="#2b2f38" roughness={1} />
      </mesh>
      <mesh position={[-0.55, 0, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[1.2, 0.06, 0.34]} />
        <meshStandardMaterial color="#2b2f38" roughness={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color="#20242c" roughness={1} />
      </mesh>
    </group>
  ))
}

// ---------------------------------------------------------------------------
// The launch site: rolling green hills, wildflowers, fluffy clouds.
// The sky matches the visitor's real local time (day / sunset / night).
// Preview any sky with ?sky=day, ?sky=sunset or ?sky=night in the URL.
// ---------------------------------------------------------------------------
export function timeOfDayNow() {
  const h = new Date().getHours()
  if (h >= 8 && h < 17) return 'day'
  if ((h >= 5 && h < 8) || (h >= 17 && h < 20)) return 'sunset'
  return 'night'
}

const SKIES = {
  day: {
    grass: '#5aa250',
    bg: '#8ecdf0', fog: '#c4e2f2',
    hemiSky: '#cfe9ff', hemiGround: '#3e7f3a', hemiInt: 0.95,
    dir: '#fff4d6', dirInt: 1.5, dirPos: [120, 180, 60],
    orb: '#fff6d0', orbPos: [180, 210, -260], orbScale: 90,
    cloud: '#ffffff', cloudOpacity: 1, stars: false, birds: true,
  },
  sunset: {
    grass: '#578f45',
    bg: '#e8875a', fog: '#f0b98a',
    hemiSky: '#ffd9b0', hemiGround: '#4a6a3a', hemiInt: 0.75,
    dir: '#ffb066', dirInt: 1.2, dirPos: [220, 60, -140],
    orb: '#ffcf90', orbPos: [240, 70, -240], orbScale: 130,
    cloud: '#ffd8c2', cloudOpacity: 0.9, stars: false, birds: true,
  },
  night: {
    grass: '#2a4634',
    bg: '#0a1226', fog: '#101c38',
    hemiSky: '#31436b', hemiGround: '#12241a', hemiInt: 0.55,
    dir: '#9fb8e8', dirInt: 0.55, dirPos: [-140, 160, -80],
    orb: '#eef4ff', orbPos: [-160, 190, -240], orbScale: 55, // the moon
    cloud: '#93a7c9', cloudOpacity: 0.4, stars: true, birds: false,
  },
}

// one fluffy cumulus cloud = a cluster of soft puffs
function CloudCluster({ pos, scale, color, opacity }) {
  const puffs = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        off: [(Math.random() - 0.5) * 1.5, (Math.random() - 0.25) * 0.45, 0],
        s: 0.5 + Math.random() * 0.6,
        o: 0.6 + Math.random() * 0.4,
      })),
    [],
  )
  return (
    <group position={pos}>
      {puffs.map((p, i) => (
        <sprite key={i} position={[p.off[0] * scale, p.off[1] * scale, 0]} scale={[scale * p.s, scale * p.s * 0.62, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color={color}
            transparent
            opacity={p.o * opacity}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

export function GroundScene({ skyOverride }) {
  // 'auto' follows the visitor's real local time; a chosen sky wins
  const sky = skyOverride || timeOfDayNow()
  const P = SKIES[sky]
  const treeGroup = useRef()
  const cloudGroup = useRef()

  // a modest number of trees, natural greens only, kept off the meadow foreground
  const trees = useMemo(
    () =>
      Array.from({ length: 30 }, () => {
        const a = Math.random() * Math.PI * 2
        const d = 60 + Math.random() * 240
        return {
          pos: [Math.cos(a) * d, 0, Math.sin(a) * d],
          s: 0.7 + Math.random() * 1.1,
          leafy: Math.random() > 0.45,
          color:
            Math.random() > 0.45
              ? LEAFY_COLORS[Math.floor(Math.random() * LEAFY_COLORS.length)]
              : CONIFER_GREENS[Math.floor(Math.random() * CONIFER_GREENS.length)],
          sway: Math.random() * Math.PI * 2,
        }
      }),
    [],
  )

  // a thick carpet of colourful wildflowers, like a Tuscan meadow
  const flowers = useMemo(() => {
    const n = 1100
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const palette = ['#d63b4f', '#ff6f91', '#ffffff', '#ffd166', '#ff9d5c', '#e84f6a'].map(
      (c) => new THREE.Color(c),
    )
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const d = 8 + Math.pow(Math.random(), 1.4) * 250
      pos[i * 3] = Math.cos(a) * d
      pos[i * 3 + 1] = 0.35
      pos[i * 3 + 2] = Math.sin(a) * d
      const c = palette[i % palette.length]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [])

  // rolling hills: big soft green mounds instead of pointy mountains
  const hills = useMemo(() => {
    const greens = ['#4d9a44', '#4a8f42', '#569f4c', '#3f823c', '#5da653']
    const near = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + 0.7
      const d = 150 + Math.random() * 110
      return {
        pos: [Math.cos(a) * d, -4, Math.sin(a) * d],
        sx: 55 + Math.random() * 45,
        sy: 12 + Math.random() * 12,
        color: greens[i % greens.length],
      }
    })
    const far = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.2
      const d = 330 + Math.random() * 70
      return {
        pos: [Math.cos(a) * d, -6, Math.sin(a) * d],
        sx: 110 + Math.random() * 70,
        sy: 26 + Math.random() * 22,
        color: greens[(i + 2) % greens.length],
      }
    })
    return [...near, ...far]
  }, [])

  // loads of fluffy clouds
  const clouds = useMemo(
    () =>
      Array.from({ length: 24 }, () => {
        const a = Math.random() * Math.PI * 2
        const d = 130 + Math.random() * 300
        return {
          pos: [Math.cos(a) * d, 75 + Math.random() * 80, Math.sin(a) * d],
          scale: 34 + Math.random() * 44,
          drift: 1 + Math.random() * 2.2,
        }
      }),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (treeGroup.current) {
      treeGroup.current.children.forEach((tr, i) => {
        tr.rotation.z = Math.sin(t * 1.3 + trees[i].sway) * 0.06
        tr.rotation.x = Math.cos(t * 0.9 + trees[i].sway) * 0.035
      })
    }
    if (cloudGroup.current) {
      cloudGroup.current.children.forEach((cl, i) => {
        cl.position.x += clouds[i].drift * 0.055
        if (cl.position.x > 460) cl.position.x = -460
      })
    }
  })

  return (
    <>
      <color attach="background" args={[P.bg]} />
      <fog attach="fog" args={[P.fog, 100, 470]} />
      <hemisphereLight args={[P.hemiSky, P.hemiGround, P.hemiInt]} />
      <directionalLight position={P.dirPos} intensity={P.dirInt} color={P.dir} />
      {/* procedural environment so the cockpit metal has something to reflect */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={[P.bg]} />
        <Lightformer intensity={2.2} color={P.dir} position={[8, 10, -6]} scale={3} form="circle" />
        <Lightformer intensity={0.8} color={P.hemiGround} position={[0, -6, 0]} scale={[20, 6, 1]} rotation={[Math.PI / 2, 0, 0]} />
      </Environment>
      {P.stars && <Stars radius={420} depth={60} count={3500} factor={6} saturation={0} fade speed={1.6} />}

      {/* meadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[460, 48]} />
        <meshStandardMaterial map={grassTexture()} roughness={1} />
      </mesh>

      {/* launch pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color="#8b8f99" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[12.4, 13.4, 32]} />
        <meshStandardMaterial color="#e0a13c" roughness={0.8} />
      </mesh>

      {/* rolling hills, near and far — grass-textured */}
      {hills.map((hl, i) => (
        <mesh key={i} position={hl.pos} scale={[hl.sx, hl.sy, hl.sx]}>
          <sphereGeometry args={[1, 32, 20]} />
          <meshStandardMaterial map={grassTexture()} color={hl.color} roughness={1} />
        </mesh>
      ))}

      {/* the living grass field */}
      <GrassField tint={P.grass} />

      <group ref={treeGroup}>
        {trees.map((t, i) => (
          <group key={i} position={t.pos}>
            {t.leafy ? <LeafyTree color={t.color} s={t.s} /> : <Conifer color={t.color} s={t.s} />}
          </group>
        ))}
      </group>

      {/* wildflower carpet */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[flowers[0], 3]} />
          <bufferAttribute attach="attributes-color" args={[flowers[1], 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.6}
          vertexColors
          sizeAttenuation
          map={glowTexture()}
          transparent
          alphaTest={0.2}
          depthWrite={false}
        />
      </points>

      <group ref={cloudGroup}>
        {clouds.map((c, i) => (
          <CloudCluster key={i} pos={c.pos} scale={c.scale} color={P.cloud} opacity={P.cloudOpacity} />
        ))}
      </group>

      {P.birds && <Birds />}

      {/* the sun by day, the moon by night */}
      <sprite position={P.orbPos} scale={[P.orbScale, P.orbScale, 1]}>
        <spriteMaterial map={glowTexture()} color={P.orb} transparent opacity={0.9} depthWrite={false} />
      </sprite>
    </>
  )
}

// ---------------------------------------------------------------------------
// The warp jump: a tunnel of light streaks rushing past for ~2 seconds.
// ---------------------------------------------------------------------------
const STREAK_COLORS = [
  ['#dbe9ff', 0.7],
  ['#8fb5ff', 0.2],
  ['#ffd9a8', 0.1],
]
function pickStreakColor() {
  const r = Math.random()
  let acc = 0
  for (const [c, p] of STREAK_COLORS) {
    acc += p
    if (r <= acc) return new THREE.Color(c)
  }
  return new THREE.Color('#ffffff')
}

export function WarpTunnel() {
  const a = useRef()
  const b = useRef()
  const geometry = useMemo(() => {
    const n = 380
    const pos = new Float32Array(n * 2 * 3)
    const col = new Float32Array(n * 2 * 3)
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2
      const r = 3 + Math.pow(Math.random(), 0.7) * 62
      const x = Math.cos(ang) * r
      const y = 5 + Math.sin(ang) * r
      const z = -Math.random() * 800
      const len = 30 + Math.random() * 90
      pos.set([x, y, z, x, y, z - len], i * 6)
      const c = pickStreakColor()
      col.set([c.r, c.g, c.b, c.r * 0.3, c.g * 0.3, c.b * 0.3], i * 6)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  useFrame((_, dt) => {
    for (const ref of [a, b]) {
      ref.current.position.z += 950 * dt
      if (ref.current.position.z > 850) ref.current.position.z -= 1700
    }
  })

  return (
    <>
      <color attach="background" args={['#020308']} />
      <lineSegments ref={a} geometry={geometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={b} geometry={geometry} position={[0, 0, -850]}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <sprite position={[0, 5, -260]} scale={[70, 70, 1]}>
        <spriteMaterial map={glowTexture()} color="#cfe4ff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </>
  )
}

// ---------------------------------------------------------------------------
// The 3D cockpit. Anchored to the WORLD, not your eyes: turn your head and
// you look around the interior, like a real pilot seat. On 'arrive' its
// panels fly apart and fade ("nano-tech retract").
// ---------------------------------------------------------------------------
const RETRACT_SECONDS = 1.2
const PART_EXITS = {
  dash: [0, -5, -4],
  pillarL: [-6, 2, 0],
  pillarR: [6, 2, 0],
  roof: [0, 6, 0],
  back: [0, 1, 7],
  sillL: [-6, -1, 0],
  sillR: [6, -1, 0],
  floor: [0, -6, 0],
}

// brushed-metal hull: anisotropic streak texture drives colour, roughness & bump
const hullMat = {
  color: '#4a5878',
  metalness: 0.75,
  roughness: 0.5,
  get map() {
    return brushedMetalTexture()
  },
  get roughnessMap() {
    return brushedMetalTexture()
  },
  get bumpMap() {
    return brushedMetalTexture()
  },
  bumpScale: 0.08,
}

export function Cockpit3D({ phase, onGo, onForbidden }) {
  const { camera } = useThree()
  const root = useRef()
  const parts = useRef({})
  const bases = useRef({})
  const retractT = useRef(0)

  useFrame((_, dt) => {
    if (!root.current) return
    // the cockpit follows the ship's position (eye sits at local (0, 0.8, 0))
    root.current.position.set(camera.position.x, camera.position.y - 0.8, camera.position.z)

    if (phase === 'arrive') {
      retractT.current = Math.min(retractT.current + dt / RETRACT_SECONDS, 1)
      const e = retractT.current * retractT.current
      for (const [key, obj] of Object.entries(parts.current)) {
        if (!obj) continue
        if (!bases.current[key]) bases.current[key] = obj.position.clone()
        const base = bases.current[key]
        const exit = PART_EXITS[key]
        obj.position.set(base.x + exit[0] * e, base.y + exit[1] * e, base.z + exit[2] * e)
        obj.traverse((child) => {
          if (child.material) {
            child.material.transparent = true
            child.material.opacity = 1 - e
          }
        })
      }
    }
  })

  const set = (key) => (el) => (parts.current[key] = el)

  return (
    <group ref={root}>
      {/* floor */}
      <group ref={set('floor')}>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[1.9, 2.1, 0.16, 24]} />
          <meshStandardMaterial {...hullMat} color="#0d1322" />
        </mesh>
      </group>

      {/* dashboard with the console screen and GO button */}
      <group ref={set('dash')}>
        <mesh position={[0, -0.15, -1.85]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[3.4, 0.55, 0.9]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
        <mesh position={[0, 0.14, -1.52]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[3.4, 0.05, 0.06]} />
          <meshStandardMaterial color="#ff9d3c" emissive="#ff9d3c" emissiveIntensity={1.4} />
        </mesh>
        {phase === 'ground' && (
          <Html
            position={[0, 1.02, -1.95]}
            rotation={[-0.12, 0, 0]}
            transform
            distanceFactor={1.3}
            zIndexRange={[35, 0]}
          >
            {/* one big touch panel: briefing, systems, and the GO button together */}
            <div className="console3d">
              <div className="console3d-body">
                <p className="cs-header">PRE-FLIGHT BRIEFING</p>
                <p className="cs-text">
                  You are about to leave Earth. Five destinations carry the record
                  of one human: who she is, what she has built, and how to reach her.
                </p>
                <ul className="cs-list">
                  <li><b>DRAG</b> anywhere to look around the cockpit</li>
                  <li>Press the glowing <b>GO</b> button to launch</li>
                </ul>
                <p className="cs-status">
                  FUEL 86% · O₂ 97% · SHIELDS 74% · NAV LOCKED : ALENA'S ARCHIVE
                </p>
              </div>
              <button className="go-btn" onClick={onGo}>
                GO
              </button>
            </div>
          </Html>
        )}
        {phase === 'warp' && (
          <Html
            position={[0, 0.26, -1.68]}
            rotation={[-0.5, 0, 0]}
            transform
            distanceFactor={0.85}
            zIndexRange={[35, 0]}
          >
            <div className="forbidden-panel">
              <p className="forbidden-caption">⚠ EMERGENCY OVERRIDE ⚠</p>
              <button className="forbidden-btn" onClick={onForbidden}>
                DO NOT
                <br />
                PRESS
              </button>
            </div>
          </Html>
        )}
      </group>

      {/* A-pillars, leaning in so you see them frame the windshield */}
      <group ref={set('pillarL')}>
        <mesh position={[-1.15, 1.15, -1.1]} rotation={[0.25, 0, 0.38]}>
          <boxGeometry args={[0.13, 3.1, 0.13]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
      </group>
      <group ref={set('pillarR')}>
        <mesh position={[1.15, 1.15, -1.1]} rotation={[0.25, 0, -0.38]}>
          <boxGeometry args={[0.13, 3.1, 0.13]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
      </group>

      {/* roof — spans the full cabin so it meets the pillars cleanly */}
      <group ref={set('roof')}>
        <mesh position={[0, 2.58, -0.2]}>
          <boxGeometry args={[3.9, 0.18, 4.0]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
        <mesh position={[0, 2.44, -0.2]}>
          <boxGeometry args={[3.5, 0.1, 3.6]} />
          <meshStandardMaterial {...hullMat} color="#1a2138" />
        </mesh>
      </group>

      {/* side sills */}
      <group ref={set('sillL')}>
        <mesh position={[-1.8, 0.3, 0]}>
          <boxGeometry args={[0.18, 1.15, 3.3]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
        <mesh position={[-1.8, 0.9, 0]}>
          <boxGeometry args={[0.06, 0.05, 3.3]} />
          <meshStandardMaterial color="#ff9d3c" emissive="#ff9d3c" emissiveIntensity={1.2} />
        </mesh>
      </group>
      <group ref={set('sillR')}>
        <mesh position={[1.8, 0.3, 0]}>
          <boxGeometry args={[0.18, 1.15, 3.3]} />
          <meshStandardMaterial {...hullMat} />
        </mesh>
        <mesh position={[1.8, 0.9, 0]}>
          <boxGeometry args={[0.06, 0.05, 3.3]} />
          <meshStandardMaterial color="#ff9d3c" emissive="#ff9d3c" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* back wall with glowing panels */}
      <group ref={set('back')}>
        <mesh position={[0, 1.1, 1.85]}>
          <boxGeometry args={[3.7, 2.9, 0.18]} />
          <meshStandardMaterial {...hullMat} color="#0f1526" />
        </mesh>
        <mesh position={[-0.9, 1.5, 1.74]}>
          <boxGeometry args={[0.6, 0.36, 0.02]} />
          <meshStandardMaterial color="#7de3f0" emissive="#7de3f0" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0.9, 1.5, 1.74]}>
          <boxGeometry args={[0.6, 0.36, 0.02]} />
          <meshStandardMaterial color="#ff9d3c" emissive="#ff9d3c" emissiveIntensity={0.7} />
        </mesh>
      </group>

      {/* cabin lights so the interior reads clearly */}
      <pointLight position={[0, 2, 0.4]} intensity={0.9} color="#a8c8e8" decay={0} distance={7} />
      <pointLight position={[0, 0.6, -0.9]} intensity={0.8} color="#ffc98a" decay={0} distance={4} />
    </group>
  )
}
