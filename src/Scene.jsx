import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import { sections } from './content'
import { waterNoiseTexture } from './proceduralTextures'

// ---------------- fresnel rim shaders (sun corona & planet atmospheres) ----------------
const RIM_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const RIM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
    gl_FragColor = vec4(uColor, f * uIntensity);
  }
`

// soft glowing rim around a planet — reads as an atmosphere
function Atmosphere({ radius, color, intensity = 0.55 }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } }),
    [color, intensity],
  )
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        vertexShader={RIM_VERT}
        fragmentShader={RIM_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ---------------- the sun's churning surface ----------------
const SUN_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const SUN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec2 uv = vUv * vec2(4.0, 2.0);
    float n1 = texture2D(uNoise, uv + vec2(uTime * 0.012, uTime * 0.004)).r;
    float n2 = texture2D(uNoise, uv * 2.3 - vec2(uTime * 0.006, uTime * 0.010) + n1 * 0.25).r;
    float g = n1 * 0.55 + n2 * 0.45;
    vec3 cool = vec3(1.05, 0.40, 0.07);
    vec3 hot  = vec3(1.45, 1.05, 0.55);
    vec3 col = mix(cool, hot, smoothstep(0.25, 0.80, g));
    // brighter granulation toward the limb
    float rim = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.0);
    col += vec3(0.55, 0.22, 0.05) * rim * (0.5 + g);
    gl_FragColor = vec4(col, 1.0);
  }
`

// The five bodies form a semicircle in front of the arrival point,
// in chronological order 01 -> 05 from left to right.
export const BODY_POSITIONS = {
  sun: [-104, 0, -60],
  saturn: [-60, 14, -104],
  moon: [0, -10, -120],
  galaxy: [60, 26, -104],
  jupiter: [104, 8, -60],
}

// how close you must fly before a body's label pops up
const LABEL_RANGE = { sun: 75, saturn: 70, moon: 65, galaxy: 65, jupiter: 70 }
// how high above each body its label floats
const LABEL_HEIGHTS = { sun: 19, saturn: 22, moon: 17, galaxy: 12, jupiter: 19 }

// ================= procedural textures (painted in code, no files) =================
const texCache = {}
function makeTexture(key, w, h, draw) {
  if (texCache[key]) return texCache[key]
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return (texCache[key] = t)
}

function softBlob(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

function noiseSpeckle(ctx, w, h, count, alpha) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${alpha})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)
  }
}

export function glowTexture() {
  return makeTexture('glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
}

// smooth solar surface: broad soft granulation, gentle limb variation, a few sunspots
function sunTexture() {
  return makeTexture('sun2', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffc25e'
    ctx.fillRect(0, 0, w, h)
    // very large, very soft warm cells melt together into a smooth surface
    for (let i = 0; i < 70; i++) {
      softBlob(
        ctx,
        Math.random() * w,
        Math.random() * h,
        50 + Math.random() * 90,
        Math.random() > 0.5 ? 'rgba(255,226,150,1)' : 'rgba(245,140,40,1)',
        0.1,
      )
    }
    // faint fine grain
    for (let i = 0; i < 500; i++) {
      softBlob(ctx, Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 'rgba(255,240,190,1)', 0.05)
    }
    // a few sunspot groups
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * w
      const y = h * 0.25 + Math.random() * h * 0.5
      softBlob(ctx, x, y, 14, 'rgba(150,60,10,1)', 0.35)
      softBlob(ctx, x, y, 6, 'rgba(80,25,5,1)', 0.5)
    }
  })
}

function saturnTexture() {
  return makeTexture('saturn', 512, 512, (ctx, w, h) => {
    const bands = [
      '#e9d6a7', '#d8ba82', '#c2a068', '#e5d09b', '#ac8b55', '#f0e2ba',
      '#c9a76e', '#dfc48d', '#b5945e', '#ecdcae', '#d0af75', '#e2cb94',
    ]
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    const stops = 26
    for (let i = 0; i <= stops; i++) {
      grad.addColorStop(i / stops, bands[(i * 7) % bands.length])
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 260; i++) {
      const y = Math.random() * h
      ctx.fillStyle = Math.random() > 0.5 ? '#fff6dd' : '#7d5f36'
      ctx.fillRect(Math.random() * w, y, 40 + Math.random() * 160, 1 + Math.random() * 2)
    }
    ctx.globalAlpha = 1
    noiseSpeckle(ctx, w, h, 2500, 0.03)
  })
}

// thin horizontal strip; the ring's UVs are remapped so it reads as concentric rings
function ringTexture() {
  return makeTexture('rings', 512, 8, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const band = (x0, x1, color, alpha) => {
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      ctx.fillRect(x0 * w, 0, (x1 - x0) * w, h)
    }
    band(0.0, 0.1, '#8f7a52', 0.25)
    band(0.1, 0.34, '#cdb386', 0.75)
    band(0.34, 0.38, '#6e5a3c', 0.3)
    band(0.38, 0.58, '#e2cfa4', 0.9)
    band(0.58, 0.63, '#241d12', 0.12) // Cassini division
    band(0.63, 0.82, '#c9b183', 0.8)
    band(0.82, 0.9, '#a78c60', 0.5)
    band(0.9, 1.0, '#8f7a52', 0.2)
    ctx.globalAlpha = 1
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(30,22,10,${Math.random() * 0.25})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, h)
    }
  })
}

// the colourful "mineral moon": grey base with blue / rust / olive mineral regions
function moonTexture() {
  return makeTexture('moon2', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b9b9c1'
    ctx.fillRect(0, 0, w, h)
    // dark maria seas
    for (let i = 0; i < 12; i++) {
      softBlob(ctx, Math.random() * w, Math.random() * h, 24 + Math.random() * 46, 'rgba(96,98,112,1)', 0.4)
    }
    // mineral tints, like enhanced-colour moon photos
    const tints = ['rgba(74,104,164,1)', 'rgba(180,96,52,1)', 'rgba(128,108,160,1)', 'rgba(120,130,86,1)', 'rgba(200,120,70,1)']
    for (let i = 0; i < 30; i++) {
      softBlob(
        ctx,
        Math.random() * w,
        Math.random() * h,
        16 + Math.random() * 44,
        tints[i % tints.length],
        0.16,
      )
    }
    // bright ray craters
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      softBlob(ctx, x, y, 26, 'rgba(240,240,246,1)', 0.3)
      softBlob(ctx, x, y, 6, 'rgba(255,255,255,1)', 0.5)
    }
    // craters: dark floor + bright rim
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 1.5 + Math.random() * 6
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(70,70,82,${0.2 + Math.random() * 0.3})`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9)
      ctx.strokeStyle = `rgba(238,238,244,${0.3 + Math.random() * 0.3})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    noiseSpeckle(ctx, w, h, 4000, 0.035)
  })
}

// Jupiter: creamy storm bands, turbulent streaks, Great Red Spot
function jupiterTexture() {
  return makeTexture('jupiter', 512, 512, (ctx, w, h) => {
    const bands = [
      '#e8d8bc', '#c8935e', '#f0e4cc', '#a9744a', '#e3c9a4', '#8f5f3d',
      '#f2e6d0', '#c08050', '#dfc09a', '#b5875c', '#e8d8bc', '#9c6a44',
    ]
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    const stops = 22
    for (let i = 0; i <= stops; i++) {
      grad.addColorStop(i / stops, bands[(i * 5) % bands.length])
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    // turbulent horizontal streaks
    ctx.globalAlpha = 0.14
    for (let i = 0; i < 420; i++) {
      const y = Math.random() * h
      ctx.fillStyle = Math.random() > 0.5 ? '#fdf3e0' : '#6e4526'
      ctx.fillRect(Math.random() * w, y, 60 + Math.random() * 200, 1 + Math.random() * 3)
    }
    ctx.globalAlpha = 1
    // small swirling storms
    for (let i = 0; i < 40; i++) {
      softBlob(
        ctx,
        Math.random() * w,
        Math.random() * h,
        5 + Math.random() * 14,
        Math.random() > 0.5 ? 'rgba(250,240,220,1)' : 'rgba(150,95,55,1)',
        0.18,
      )
    }
    // the Great Red Spot
    const sx = w * 0.68
    const sy = h * 0.62
    softBlob(ctx, sx, sy, 46, 'rgba(196,85,58,1)', 0.5)
    softBlob(ctx, sx, sy, 30, 'rgba(210,95,60,1)', 0.6)
    softBlob(ctx, sx, sy, 14, 'rgba(232,140,100,1)', 0.6)
    softBlob(ctx, sx, sy, 58, 'rgba(240,225,200,1)', 0.18)
    noiseSpeckle(ctx, w, h, 2000, 0.03)
  })
}

function earthTexture() {
  return makeTexture('earth', 512, 256, (ctx, w, h) => {
    const sea = ctx.createLinearGradient(0, 0, 0, h)
    sea.addColorStop(0, '#9fc6e8')
    sea.addColorStop(0.18, '#1e5aa8')
    sea.addColorStop(0.5, '#154a94')
    sea.addColorStop(0.82, '#1e5aa8')
    sea.addColorStop(1, '#bcd9ee')
    ctx.fillStyle = sea
    ctx.fillRect(0, 0, w, h)
    for (let c = 0; c < 9; c++) {
      const cx = Math.random() * w
      const cy = h * 0.2 + Math.random() * h * 0.6
      for (let i = 0; i < 26; i++) {
        softBlob(
          ctx,
          cx + (Math.random() - 0.5) * 70,
          cy + (Math.random() - 0.5) * 40,
          5 + Math.random() * 16,
          Math.random() > 0.3 ? 'rgba(64,124,58,1)' : 'rgba(158,138,84,1)',
          0.85,
        )
      }
    }
  })
}

function cloudTexture() {
  return makeTexture('clouds', 512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    for (let i = 0; i < 240; i++) {
      const r = 6 + Math.random() * 20
      ctx.save()
      ctx.translate(Math.random() * w, Math.random() * h)
      ctx.scale(1.8, 0.7)
      softBlob(ctx, 0, 0, r, 'rgba(255,255,255,1)', 0.25 + Math.random() * 0.35)
      ctx.restore()
    }
  })
}

// ============================== labels & hitboxes ==============================
// Labels stay hidden until you fly close — discovery is part of the game.
function ProximityLabels({ onSelect, enabled }) {
  const [near, setNear] = useState({})
  const probe = useRef(new THREE.Vector3())
  useFrame(({ camera }) => {
    if (!enabled) return
    let changed = false
    const next = {}
    for (const [id, p] of Object.entries(BODY_POSITIONS)) {
      probe.current.set(p[0], p[1], p[2])
      next[id] = camera.position.distanceTo(probe.current) < LABEL_RANGE[id]
      if (next[id] !== !!near[id]) changed = true
    }
    if (changed) setNear(next)
  })
  if (!enabled) return null
  return Object.entries(BODY_POSITIONS).map(([id, p]) => (
    <group key={id} position={p}>
      <Html
        position={[0, LABEL_HEIGHTS[id] + 7, 0]}
        transform
        sprite
        distanceFactor={30}
        zIndexRange={[30, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className={`planet-label ${near[id] ? 'is-near' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(id)
          }}
        >
          <span className="planet-label-num">{sections[id].num}</span>
          {sections[id].label}
        </button>
      </Html>
    </group>
  ))
}

function Hitbox({ id, radius, onSelect }) {
  return (
    <mesh
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <sphereGeometry args={[radius * 1.5, 16, 16]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ================================== Sun ==================================
function Sun({ onSelect }) {
  const surf = useRef()
  const mat = useRef()
  const corona = useRef()
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uNoise: { value: waterNoiseTexture() } }),
    [],
  )
  useFrame((state, dt) => {
    surf.current.rotation.y += dt * 0.05
    if (mat.current) mat.current.uniforms.uTime.value += dt
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.07
    corona.current.scale.set(pulse, pulse, pulse)
  })
  return (
    <group position={BODY_POSITIONS.sun}>
      {/* churning plasma surface */}
      <mesh ref={surf}>
        <sphereGeometry args={[15, 64, 64]} />
        <shaderMaterial ref={mat} vertexShader={SUN_VERT} fragmentShader={SUN_FRAG} uniforms={uniforms} />
      </mesh>
      {/* breathing fresnel corona, hugging the surface */}
      <group ref={corona}>
        <Atmosphere radius={15.8} color="#ffab4e" intensity={0.9} />
        <Atmosphere radius={17.2} color="#ff7a24" intensity={0.35} />
      </group>
      <sprite scale={[64, 64, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffb45e"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <pointLight color="#fff1d6" intensity={2.6} decay={0} />
      <Hitbox id="sun" radius={15} onSelect={onSelect} />
    </group>
  )
}

// ================================ Saturn =================================
function Saturn({ onSelect }) {
  const ref = useRef()
  const rings = useMemo(() => {
    const geo = new THREE.RingGeometry(17, 30, 160, 1)
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      uv.setXY(i, (v.length() - 17) / (30 - 17), 0.5)
    }
    return geo
  }, [])
  const ringRef = useRef()
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.35
    ringRef.current.rotation.z += dt * 0.06
  })
  return (
    <group position={BODY_POSITIONS.saturn} rotation={[0.38, 0, 0.3]}>
      <mesh ref={ref}>
        <sphereGeometry args={[13, 64, 64]} />
        <meshStandardMaterial map={saturnTexture()} roughness={0.85} />
      </mesh>
      <mesh ref={ringRef} geometry={rings} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial map={ringTexture()} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Atmosphere radius={13.9} color="#e8d5a0" intensity={0.5} />
      <Hitbox id="saturn" radius={16} onSelect={onSelect} />
    </group>
  )
}

// ================================= Moon ==================================
function Moon({ onSelect }) {
  const ref = useRef()
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.2))
  return (
    <group position={BODY_POSITIONS.moon}>
      <mesh ref={ref}>
        <sphereGeometry args={[14, 64, 64]} />
        <meshStandardMaterial map={moonTexture()} bumpMap={moonTexture()} bumpScale={0.6} roughness={1} />
      </mesh>
      <Atmosphere radius={14.6} color="#9fb0d8" intensity={0.3} />
      <Hitbox id="moon" radius={14} onSelect={onSelect} />
    </group>
  )
}

// =============================== Jupiter =================================
function Jupiter({ onSelect }) {
  const ref = useRef()
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.28))
  return (
    <group position={BODY_POSITIONS.jupiter} rotation={[0.05, 0, -0.08]}>
      <mesh ref={ref}>
        <sphereGeometry args={[15, 64, 64]} />
        <meshStandardMaterial map={jupiterTexture()} roughness={0.9} />
      </mesh>
      <Atmosphere radius={15.9} color="#f0c8a0" intensity={0.55} />
      <Hitbox id="jupiter" radius={15} onSelect={onSelect} />
    </group>
  )
}

// ========================= Milky Way (spiral galaxy) =========================
function Galaxy({ onSelect }) {
  const ref = useRef()
  const [positions, colors] = useMemo(() => {
    const arms = 11000
    const bulge = 2600
    const count = arms + bulge
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const inner = new THREE.Color('#ffdfae')
    const outer = new THREE.Color('#7fadff')
    const core = new THREE.Color('#fff2d0')
    const c = new THREE.Color()
    for (let i = 0; i < arms; i++) {
      const r = Math.pow(Math.random(), 0.6) * 28
      const arm = ((i % 3) / 3) * Math.PI * 2
      const spin = r * 0.19
      const scatter = () => Math.pow(Math.random() - 0.5, 3) * 32
      pos[i * 3] = Math.cos(arm + spin) * r + scatter()
      pos[i * 3 + 1] = Math.pow(Math.random() - 0.5, 3) * 10 * (1 - r / 34)
      pos[i * 3 + 2] = Math.sin(arm + spin) * r + scatter()
      c.copy(inner).lerp(outer, Math.min(r / 26, 1))
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    for (let i = arms; i < count; i++) {
      const r = Math.pow(Math.random(), 2.2) * 8
      const a = Math.random() * Math.PI * 2
      const e = (Math.random() - 0.5) * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = e * (4 - r * 0.2)
      pos[i * 3 + 2] = Math.sin(a) * r
      col[i * 3] = core.r
      col[i * 3 + 1] = core.g
      col[i * 3 + 2] = core.b
    }
    return [pos, col]
  }, [])

  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.09))

  return (
    <group position={BODY_POSITIONS.galaxy} rotation={[0.6, 0, 0.3]}>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.7}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <sprite scale={[18, 18, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ffedc9"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <Hitbox id="galaxy" radius={15} onSelect={onSelect} />
    </group>
  )
}

// ========================== Earth (left behind) ==========================
function Earth() {
  const clouds = useRef()
  const globe = useRef()
  useFrame((_, dt) => {
    clouds.current.rotation.y += dt * 0.07
    globe.current.rotation.y += dt * 0.04
  })
  return (
    <group position={[0, -6, 250]}>
      <mesh ref={globe}>
        <sphereGeometry args={[10, 48, 48]} />
        <meshStandardMaterial map={earthTexture()} roughness={0.65} />
      </mesh>
      <mesh ref={clouds}>
        <sphereGeometry args={[10.25, 48, 48]} />
        <meshStandardMaterial map={cloudTexture()} transparent roughness={1} depthWrite={false} />
      </mesh>
      <Atmosphere radius={10.8} color="#5fb0ff" intensity={0.7} />
      <pointLight color="#cfe0ff" intensity={1.8} decay={0} position={[12, 16, 40]} />
    </group>
  )
}

// ======================= twinkling bright stars ========================
function TwinkleStars() {
  const group = useRef()
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, () => {
        const a = Math.random() * Math.PI * 2
        const r = 260 + Math.random() * 180
        return {
          pos: [Math.cos(a) * r, (Math.random() - 0.4) * 260, Math.sin(a) * r - 40],
          s: 1.6 + Math.random() * 2.8,
          ph: Math.random() * Math.PI * 2,
          speed: 1.8 + Math.random() * 2.4,
        }
      }),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((s, i) => {
      const k = Math.abs(Math.sin(t * stars[i].speed + stars[i].ph))
      s.material.opacity = 0.1 + 0.9 * k
      const sc = stars[i].s * (0.7 + 0.5 * k)
      s.scale.set(sc, sc, 1)
    })
  })
  return (
    <group ref={group}>
      {stars.map((s, i) => (
        <sprite key={i} position={s.pos} scale={[s.s, s.s, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color="#eef2ff"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// =========================== shooting stars ============================
function ShootingStars() {
  const COUNT = 6
  const heads = useRef([])
  const trails = useRef([])
  const meteors = useRef(
    Array.from({ length: COUNT }, () => ({ delay: 1 + Math.random() * 4, t: 0, dur: 0, active: false })),
  )

  const spawn = (m) => {
    const a = Math.random() * Math.PI * 2
    m.start = new THREE.Vector3(Math.cos(a) * 260, 60 + Math.random() * 140, Math.sin(a) * 260 - 80)
    m.dir = new THREE.Vector3((Math.random() - 0.5) * 1.6, -(0.4 + Math.random() * 0.7), (Math.random() - 0.5) * 1.6).normalize()
    m.speed = 220 + Math.random() * 160
    m.dur = 0.8 + Math.random() * 0.7
    m.len = 26 + Math.random() * 26
    m.t = 0
    m.active = true
  }

  useFrame((_, dt) => {
    meteors.current.forEach((m, i) => {
      const head = heads.current[i]
      const trail = trails.current[i]
      if (!head || !trail) return
      if (!m.active) {
        m.delay -= dt
        head.visible = false
        trail.visible = false
        if (m.delay <= 0) spawn(m)
        return
      }
      m.t += dt
      if (m.t >= m.dur) {
        m.active = false
        m.delay = 2 + Math.random() * 5
        return
      }
      const fade = Math.sin((m.t / m.dur) * Math.PI)
      const p = m.start.clone().addScaledVector(m.dir, m.speed * m.t)
      head.visible = true
      trail.visible = true
      head.position.copy(p)
      head.material.opacity = fade
      const attr = trail.geometry.attributes.position
      attr.setXYZ(0, p.x, p.y, p.z)
      attr.setXYZ(1, p.x - m.dir.x * m.len, p.y - m.dir.y * m.len, p.z - m.dir.z * m.len)
      attr.needsUpdate = true
      trail.material.opacity = fade * 0.8
    })
  })

  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <group key={i}>
          <sprite ref={(el) => (heads.current[i] = el)} scale={[3.4, 3.4, 1]} visible={false}>
            <spriteMaterial
              map={glowTexture()}
              color="#eaf4ff"
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          <lineSegments ref={(el) => (trails.current[i] = el)} visible={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(6), 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color="#cfe4ff"
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        </group>
      ))}
    </>
  )
}

export default function Scene({ onSelect, labelsVisible }) {
  return (
    <>
      <color attach="background" args={['#04040c']} />
      <ambientLight intensity={0.22} />
      <Stars radius={500} depth={100} count={9000} factor={5} saturation={0} fade speed={0.6} />
      <Stars radius={440} depth={70} count={2500} factor={7} saturation={0} fade speed={1.8} />
      <TwinkleStars />
      <ShootingStars />
      <Earth />
      <Sun onSelect={onSelect} />
      <Saturn onSelect={onSelect} />
      <Moon onSelect={onSelect} />
      <Galaxy onSelect={onSelect} />
      <Jupiter onSelect={onSelect} />
      <ProximityLabels onSelect={onSelect} enabled={labelsVisible} />
    </>
  )
}
