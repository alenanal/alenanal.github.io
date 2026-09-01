// Singleton music manager. Lives on window so there is only ever ONE
// player per track per page — no overlapping copies, even across
// dev hot-reloads.
//   launchpad: /nature.mp3 · space: /music.mp3 · lantern world: /lantern.mp3
const store = (window.__portfolioAudio ||= {
  nature: null,
  space: null,
  lantern: null,
  on: true,
  ctx: null,
  routed: {},
})

// the birdsong recording is mastered very quietly (≈ -40dB), so it needs
// more than volume=1 can give — a WebAudio gain stage boosts past 1x
const BOOST = { nature: 6 }

function ensure(key, src, volume) {
  if (!store[key]) {
    const a = new Audio(src)
    a.loop = true
    a.volume = volume
    a.preload = 'auto'
    store[key] = a
  }
  store.routed ||= {} // older hot-reloaded stores may not have this yet
  const boost = BOOST[key] || 1
  if (boost > 1 && !store.routed[key]) {
    try {
      store.ctx ||= new (window.AudioContext || window.webkitAudioContext)()
      const node = store.ctx.createMediaElementSource(store[key])
      const gain = store.ctx.createGain()
      gain.gain.value = boost
      node.connect(gain)
      gain.connect(store.ctx.destination)
      store.routed[key] = true
    } catch {
      // if routing fails, the element still plays at normal volume
    }
  }
  store.ctx?.resume().catch(() => {})
  return store[key]
}

// start fetching every track at page load, so nothing has to buffer
// at the moment the visitor finally clicks
export function preloadAll() {
  ensureQuiet('nature', '/nature.mp3', 1)
  ensureQuiet('space', '/music.mp3', 0.35)
  ensureQuiet('lantern', '/lantern.mp3', 0.6)
}
function ensureQuiet(key, src, volume) {
  if (!store[key]) {
    const a = new Audio(src)
    a.loop = true
    a.volume = volume
    a.preload = 'auto'
    store[key] = a
  }
}

function pauseAll() {
  store.nature?.pause()
  store.space?.pause()
  store.lantern?.pause()
}

export const music = {
  get on() {
    return store.on
  },
  // birdsong on the launchpad (starts on the visitor's first interaction)
  enterGround() {
    store.space?.pause()
    store.lantern?.pause()
    if (store.on) ensure('nature', '/nature.mp3', 1).play().catch(() => {})
  },
  startSpace() {
    store.nature?.pause()
    store.lantern?.pause()
    if (store.on) ensure('space', '/music.mp3', 0.35).play().catch(() => {})
  },
  enterLantern() {
    store.nature?.pause()
    store.space?.pause()
    if (store.on) ensure('lantern', '/lantern.mp3', 0.6).play().catch(() => {})
  },
  exitLantern() {
    store.lantern?.pause()
    if (store.on) store.space?.play().catch(() => {})
  },
  stopAll: pauseAll,
  // returns the new on/off state
  toggle(phase) {
    store.on = !store.on
    if (!store.on) {
      pauseAll()
    } else if (phase === 'lantern') {
      ensure('lantern', '/lantern.mp3', 0.6).play().catch(() => {})
    } else if (phase === 'ground') {
      ensure('nature', '/nature.mp3', 1).play().catch(() => {})
    } else {
      ensure('space', '/music.mp3', 0.35).play().catch(() => {})
    }
    return store.on
  },
}
