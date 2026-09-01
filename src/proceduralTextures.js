// ============================================================
// Procedural texture & geometry toolkit — everything generated
// in code at startup, no external asset files.
// ============================================================
import * as THREE from 'three'

// deterministic PRNG so textures look the same every visit
export function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// value-noise fractal brownian motion (fBm), optionally tileable
export function makeFbm(seed = 1) {
  const rand = mulberry32(seed)
  const lattice = new Float32Array(256 * 256)
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand()
  const val = (ix, iy, wrap) => {
    let x = ix
    let y = iy
    if (wrap) {
      x = ((ix % wrap) + wrap) % wrap
      y = ((iy % wrap) + wrap) % wrap
    }
    return lattice[(x & 255) * 256 + (y & 255)]
  }
  const smooth = (t) => t * t * (3 - 2 * t)
  const noise = (x, y, wrap) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const u = smooth(x - ix)
    const v = smooth(y - iy)
    const a = val(ix, iy, wrap)
    const b = val(ix + 1, iy, wrap)
    const c = val(ix, iy + 1, wrap)
    const d = val(ix + 1, iy + 1, wrap)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  // returns 0..1
  return function fbm(x, y, { octaves = 4, lacunarity = 2, gain = 0.5, wrap } = {}) {
    let amp = 0.5
    let f = 1
    let sum = 0
    let norm = 0
    for (let o = 0; o < octaves; o++) {
      sum += noise(x * f, y * f, wrap ? wrap * f : undefined) * amp
      norm += amp
      amp *= gain
      f *= lacunarity
    }
    return sum / norm
  }
}

const texCache = {}

function toTexture(canvas, { colorSpace = 'srgb', repeat = 1 } = {}) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (repeat !== 1) t.repeat.set(repeat, repeat)
  t.anisotropy = 4
  if (colorSpace === 'srgb') t.colorSpace = THREE.SRGBColorSpace
  return t
}

// generic fBm-shaded texture: base colour modulated by noise, with an
// optional post-draw pass for streaks / details on top
export function fbmTexture(key, opts = {}) {
  if (texCache[key]) return texCache[key]
  const {
    seed = 1,
    size = 512,
    scale = 6,
    octaves = 4,
    base = [70, 80, 120],
    vary = [26, 26, 34],
    contrast = 1,
    colorSpace = 'srgb',
    repeat = 1,
    post = null,
  } = opts
  const fbm = makeFbm(seed)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  const d = img.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm((x / size) * scale, (y / size) * scale, { octaves, wrap: scale })
      const k = (n - 0.5) * 2 * contrast
      const i = (y * size + x) * 4
      d[i] = Math.max(0, Math.min(255, base[0] + vary[0] * k))
      d[i + 1] = Math.max(0, Math.min(255, base[1] + vary[1] * k))
      d[i + 2] = Math.max(0, Math.min(255, base[2] + vary[2] * k))
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  if (post) post(ctx, size, fbm)
  return (texCache[key] = toTexture(c, { colorSpace, repeat }))
}

// weathered plaster/stone for the castle, with vertical rain streaks
export function castleWallTexture() {
  return fbmTexture('castleWall', {
    seed: 11,
    size: 512,
    scale: 7,
    octaves: 5,
    base: [64, 74, 122],
    vary: [20, 20, 26],
    contrast: 1.1,
    post: (ctx, size) => {
      const rand = mulberry32(99)
      // rain streaks running down the walls
      for (let i = 0; i < 70; i++) {
        const x = rand() * size
        const w = 2 + rand() * 8
        const h = size * (0.25 + rand() * 0.7)
        const y = rand() * size * 0.4
        const g = ctx.createLinearGradient(0, y, 0, y + h)
        g.addColorStop(0, 'rgba(18,20,38,0)')
        g.addColorStop(0.35, `rgba(18,20,38,${0.1 + rand() * 0.16})`)
        g.addColorStop(1, 'rgba(18,20,38,0)')
        ctx.fillStyle = g
        ctx.fillRect(x, y, w, h)
      }
      // faint masonry courses
      ctx.globalAlpha = 0.08
      ctx.fillStyle = '#0c0f22'
      for (let y = 0; y < size; y += 26) ctx.fillRect(0, y, size, 1.6)
      ctx.globalAlpha = 1
    },
  })
}

export function castleWallBump() {
  return fbmTexture('castleWallBump', {
    seed: 11,
    size: 512,
    scale: 7,
    octaves: 5,
    base: [128, 128, 128],
    vary: [78, 78, 78],
    colorSpace: 'linear',
  })
}

// rocky island — darker toward the waterline
export function islandTexture() {
  return fbmTexture('island', {
    seed: 23,
    size: 512,
    scale: 6,
    octaves: 5,
    base: [46, 54, 92],
    vary: [22, 22, 28],
    contrast: 1.15,
    post: (ctx, size) => {
      const g = ctx.createLinearGradient(0, size * 0.45, 0, size)
      g.addColorStop(0, 'rgba(6,8,20,0)')
      g.addColorStop(1, 'rgba(6,8,20,0.55)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    },
  })
}

export function islandBump() {
  return fbmTexture('islandBump', {
    seed: 23,
    size: 512,
    scale: 9,
    octaves: 5,
    base: [128, 128, 128],
    vary: [90, 90, 90],
    colorSpace: 'linear',
  })
}

// grayscale tiling noise the water shader scrolls over
export function waterNoiseTexture() {
  return fbmTexture('waterNoise', {
    seed: 5,
    size: 256,
    scale: 8,
    octaves: 4,
    base: [128, 128, 128],
    vary: [110, 110, 110],
    colorSpace: 'linear',
  })
}

// warm paper for lanterns: bright at the flame, dim at the top,
// with rib lines and seams baked in so they read as real objects
export function lanternPaperTexture() {
  if (texCache.lanternPaper) return texCache.lanternPaper
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, size)
  g.addColorStop(0, '#b56a1e') // top of lantern (canvas y0 = cylinder top)
  g.addColorStop(0.45, '#f09a38')
  g.addColorStop(0.8, '#ffcf7e')
  g.addColorStop(1, '#ffe9b8') // flame end, brightest
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  // paper mottling
  const rand = mulberry32(31)
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,240,210,0.06)' : 'rgba(120,60,10,0.06)'
    const r = 3 + rand() * 9
    ctx.beginPath()
    ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // horizontal ribs
  ctx.fillStyle = 'rgba(70,32,6,0.35)'
  ;[0.16, 0.5, 0.84].forEach((f) => ctx.fillRect(0, size * f, size, 2.4))
  // vertical seams
  ctx.fillStyle = 'rgba(70,32,6,0.22)'
  for (let x = 0; x < size; x += 32) ctx.fillRect(x, 0, 1.8, size)
  return (texCache.lanternPaper = toTexture(c))
}

// faint milky-way band with alpha, for the night sky
export function milkyWayTexture() {
  if (texCache.milkyWay) return texCache.milkyWay
  const w = 1024
  const h = 256
  const fbm = makeFbm(41)
  const fbm2 = makeFbm(42)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let y = 0; y < h; y++) {
    const band = Math.exp(-Math.pow(((y / h) - 0.5) * 2.6, 2))
    for (let x = 0; x < w; x++) {
      const n = fbm((x / w) * 9, (y / h) * 2.2, { octaves: 4 })
      const n2 = fbm2((x / w) * 22, (y / h) * 5, { octaves: 3 })
      const a = band * Math.max(0, (n - 0.42) * 2.2) * 0.85
      const i = (y * w + x) * 4
      d[i] = 150 + 90 * n2
      d[i + 1] = 140 + 85 * n2
      d[i + 2] = 215 + 40 * n2
      d[i + 3] = Math.min(255, a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return (texCache.milkyWay = t)
}

// brushed metal for the cockpit: anisotropic streaks + scratches.
// doubles as roughness/bump source (mid-grey values vary per streak)
export function brushedMetalTexture() {
  if (texCache.brushed) return texCache.brushed
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#767e92'
  ctx.fillRect(0, 0, size, size)
  const rand = mulberry32(51)
  // fine horizontal brushing
  for (let i = 0; i < 1600; i++) {
    const y = rand() * size
    const light = rand() > 0.5
    ctx.strokeStyle = light ? `rgba(210,218,235,${0.03 + rand() * 0.05})` : `rgba(30,36,52,${0.03 + rand() * 0.05})`
    ctx.lineWidth = 0.6 + rand() * 1.2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y + (rand() - 0.5) * 2)
    ctx.stroke()
  }
  // occasional scratches
  for (let i = 0; i < 26; i++) {
    const y = rand() * size
    const x = rand() * size
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(235,240,250,0.20)' : 'rgba(15,18,30,0.22)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 30 + rand() * 90, y + (rand() - 0.5) * 6)
    ctx.stroke()
  }
  return (texCache.brushed = toTexture(c, { repeat: 2 }))
}

// ---------------- displaced geometry ----------------

// sphere with noisy silhouette (the castle island)
export function displacedSphereGeometry(seed = 7, amp = 0.1) {
  const geo = new THREE.SphereGeometry(1, 48, 32)
  const fbm = makeFbm(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = fbm(v.x * 1.6 + 5, v.z * 1.6 + v.y * 0.9 + 5, { octaves: 3 })
    const k = 1 + (n - 0.5) * 2 * amp
    pos.setXYZ(i, v.x * k, v.y * k, v.z * k)
  }
  geo.computeVertexNormals()
  return geo
}

// lumpy rock (deformed icosahedron)
export function rockGeometry(seed = 3, amp = 0.32) {
  const geo = new THREE.IcosahedronGeometry(1, 2)
  const fbm = makeFbm(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = fbm(v.x * 2 + 9, v.y * 2 + v.z * 2 + 9, { octaves: 3 })
    const k = 1 + (n - 0.5) * 2 * amp
    pos.setXYZ(i, v.x * k, v.y * k * 0.8, v.z * k)
  }
  geo.computeVertexNormals()
  return geo
}
