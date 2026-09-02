import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { music, preloadAll } from './audio'
import Scene from './Scene'
import LanternScene from './LanternScene'
import { GroundScene, WarpTunnel, Cockpit3D } from './LaunchScenes'
import FlightControls from './FlightControls'
import { TitleCard, WarpFlash, FlightGuide, LanternGuide, Hud, InfoPanel, SkyPicker } from './Overlay'
import DesignBook from './DesignBook'
import './App.css'

const WARP_MS = 3400 // long enough to spot the button you must not press
const ARRIVE_MS = 1500

// ?quality=low disables ambient occlusion for older machines
const QUALITY = new URLSearchParams(window.location.search).get('quality') === 'low' ? 'low' : 'high'

export default function App() {
  // 'ground' (launch site) -> 'warp' (light tunnel) -> 'arrive' (cockpit
  // retracts) -> 'flying' (free flight between the five destinations)
  const [phase, setPhase] = useState('ground')
  const [active, setActive] = useState(null) // which dossier is open
  const [discovered, setDiscovered] = useState([]) // dossiers found so far
  const [showGuide, setShowGuide] = useState(true) // flight instructions card

  // backdrop: 'auto' follows the visitor's clock; ?sky=day|sunset|night presets it
  const [skyMode, setSkyMode] = useState(() => {
    const s = new URLSearchParams(window.location.search).get('sky')
    return ['day', 'sunset', 'night'].includes(s) ? s : 'auto'
  })

  // the button that must not be pressed
  const [lanternFlash, setLanternFlash] = useState(false)
  const [showLanternGuide, setShowLanternGuide] = useState(false)
  const pressForbidden = () => {
    setLanternFlash(true)
    setShowLanternGuide(true)
    setPhase('lantern')
    enterLanternMusic()
    setTimeout(() => setLanternFlash(false), 1000)
  }

  // ---- background music (see src/audio.js for the singleton player) ----
  const [musicOn, setMusicOn] = useState(music.on)
  const startMusic = () => music.startSpace()
  const enterLanternMusic = () => music.enterLantern()
  const exitLanternMusic = () => music.exitLantern()
  const toggleMusic = () => setMusicOn(music.toggle(phase))

  // browsers only allow sound after the first interaction, so the
  // launchpad birdsong begins at the visitor's first click or drag
  useEffect(() => {
    preloadAll() // start buffering all three tracks right away
    const wake = () => music.enterGround()
    window.addEventListener('pointerdown', wake, { once: true })
    return () => window.removeEventListener('pointerdown', wake)
  }, [])

  // land back on Earth for another launch — birdsong resumes
  const returnHome = () => {
    music.enterGround()
    setActive(null)
    setPhase('ground')
  }

  // dev/test hook: lets automated checks open a section without flying
  window.__openSection = (id) => setActive(id)

  const openSection = (id) => {
    setActive(id)
    setShowGuide(false)
    setShowLanternGuide(false)
    setDiscovered((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  useEffect(() => {
    if (phase === 'warp') {
      const t = setTimeout(() => setPhase('arrive'), WARP_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'arrive') {
      const t = setTimeout(() => setPhase('flying'), ARRIVE_MS)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div className={`app ${active ? 'dossier-open' : ''}`}>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 2500, position: [0, 5, 0] }}
        dpr={[1, 2]}
        gl={{ antialias: false }}
        onCreated={({ gl }) => {
          // ACES filmic is the default tone mapping; tune exposure for richness
          gl.toneMappingExposure = 1.12
        }}
        onPointerMissed={() => setActive(null)}
      >
        {phase === 'ground' && <GroundScene skyOverride={skyMode === 'auto' ? null : skyMode} />}
        {phase === 'warp' && <WarpTunnel />}
        {(phase === 'arrive' || phase === 'flying') && (
          <Scene onSelect={openSection} labelsVisible={phase === 'flying'} />
        )}
        {phase === 'lantern' && <LanternScene onSelect={openSection} discovered={discovered} />}
        {phase !== 'flying' && phase !== 'lantern' && (
          <Cockpit3D
            phase={phase}
            onGo={() => {
              startMusic()
              setPhase('warp')
            }}
            onForbidden={pressForbidden}
          />
        )}
        <FlightControls phase={phase} />
        {/* constant settings — changing effect props mid-flight crashes the composer */}
        <EffectComposer multisampling={QUALITY === 'high' ? 4 : 0}>
          <Bloom intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.55} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {phase === 'ground' && <TitleCard />}
      {phase === 'ground' && (
        <a className="quick-version-link" href="/basic.html">
          in a hurry? read the quick version →
        </a>
      )}
      {phase === 'ground' && <SkyPicker mode={skyMode} onChange={setSkyMode} />}
      {(phase === 'arrive' || lanternFlash) && <WarpFlash />}
      {phase === 'flying' && showGuide && <FlightGuide onDismiss={() => setShowGuide(false)} />}
      {phase === 'flying' && <Hud onSelect={openSection} discovered={discovered} />}
      {phase === 'flying' && (
        <button className="return-btn" onClick={returnHome}>
          ⟲ RETURN TO EARTH
        </button>
      )}
      {phase === 'lantern' && (
        <Hud onSelect={openSection} discovered={discovered} mode="lantern" />
      )}
      {phase === 'lantern' && showLanternGuide && !lanternFlash && (
        <LanternGuide onDismiss={() => setShowLanternGuide(false)} />
      )}
      {phase === 'lantern' && (
        <button
          className="return-btn"
          onClick={() => {
            exitLanternMusic()
            setPhase('flying')
          }}
        >
          ◂ RETURN TO YOUR SHIP
        </button>
      )}
      {active === 'jupiter' ? (
        <DesignBook onClose={() => setActive(null)} />
      ) : (
        active && <InfoPanel id={active} onClose={() => setActive(null)} />
      )}

      <button className="music-btn" onClick={toggleMusic} aria-label="Toggle music">
        {musicOn ? '♪ MUSIC ON' : '♪ MUSIC OFF'}
      </button>
    </div>
  )
}
