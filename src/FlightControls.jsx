import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Phase flow: 'ground' (pan around at the launch site) -> 'warp' (2s light
// tunnel) -> 'arrive' (glide in while the cockpit retracts) -> 'flying'.
const GROUND_POS = new THREE.Vector3(0, 5, 0)
const ARRIVE_FROM = new THREE.Vector3(0, 6, 170)
const ARRIVE_TO = new THREE.Vector3(0, 6, 105)
const ARRIVE_SECONDS = 1.4
const WORLD_RADIUS = 380 // invisible wall so you can't fly off forever

export default function FlightControls({ phase }) {
  const { camera, gl } = useThree()
  const keys = useRef({})
  const yaw = useRef(0)
  const pitch = useRef(0)
  const dragging = useRef(false)
  const last = useRef([0, 0])
  const arriveT = useRef(0)
  const prevPhase = useRef(null)
  const tmp = useRef({
    dir: new THREE.Vector3(),
    right: new THREE.Vector3(),
    move: new THREE.Vector3(),
  })

  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true
      // stop Space / arrows doing browser things (scrolling, re-clicking buttons)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
    const up = (e) => (keys.current[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    const el = gl.domElement
    const pointerDown = (e) => {
      dragging.current = true
      last.current = [e.clientX, e.clientY]
    }
    const pointerMove = (e) => {
      if (!dragging.current) return
      const dx = e.clientX - last.current[0]
      const dy = e.clientY - last.current[1]
      last.current = [e.clientX, e.clientY]
      yaw.current -= dx * 0.0026
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0026, -1.45, 1.45)
    }
    const pointerUp = () => (dragging.current = false)
    el.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      el.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [gl])

  useFrame((_, dt) => {
    const { dir, right, move } = tmp.current

    // one-time setup when a phase begins
    if (phase !== prevPhase.current) {
      if (phase === 'lantern') {
        camera.position.set(0, 2.3, 40)
        yaw.current = 0
        pitch.current = 0
      }
      if (phase === 'ground') {
        // back on the launchpad, facing the meadow again
        yaw.current = 0
        pitch.current = 0
      }
      prevPhase.current = phase
    }

    if (phase === 'lantern') {
      // rowing on the water: slow, level, dreamy
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
      const k = keys.current
      const speed = k['ShiftLeft'] || k['ShiftRight'] ? 20 : 8
      camera.getWorldDirection(dir)
      dir.y = 0
      dir.normalize()
      right.crossVectors(dir, camera.up).normalize()
      move.set(0, 0, 0)
      if (k['KeyW'] || k['ArrowUp']) move.add(dir)
      if (k['KeyS'] || k['ArrowDown']) move.sub(dir)
      if (k['KeyD'] || k['ArrowRight']) move.add(right)
      if (k['KeyA'] || k['ArrowLeft']) move.sub(right)
      if (move.lengthSq() > 0) camera.position.addScaledVector(move.normalize(), speed * dt)
      camera.position.y = 2.3
      // stay on the lake, and short of the castle island
      const flatDist = Math.hypot(camera.position.x, camera.position.z)
      if (flatDist > 300) camera.position.multiplyScalar(300 / flatDist)
      const dz = camera.position.z + 230
      const dxz = Math.hypot(camera.position.x, dz)
      if (dxz < 90) {
        const push = 90 / Math.max(dxz, 0.001)
        camera.position.x *= push
        camera.position.z = (camera.position.z + 230) * push - 230
      }
      return
    }

    if (phase === 'ground') {
      // parked on the pad: look around freely, no movement
      camera.position.copy(GROUND_POS)
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
      arriveT.current = 0
      return
    }

    if (phase === 'warp') {
      // gaze snaps forward; the ship holds steady through the jump
      yaw.current = THREE.MathUtils.damp(yaw.current, 0, 5, dt)
      pitch.current = THREE.MathUtils.damp(pitch.current, 0, 5, dt)
      camera.position.copy(GROUND_POS)
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
      arriveT.current = 0
      return
    }

    if (phase === 'arrive') {
      // drop out of warp, glide toward the semicircle of destinations
      arriveT.current += dt
      const p = Math.min(arriveT.current / ARRIVE_SECONDS, 1)
      const ease = 1 - Math.pow(1 - p, 3) // fast then settle
      camera.position.lerpVectors(ARRIVE_FROM, ARRIVE_TO, ease)
      yaw.current = 0
      pitch.current = 0
      camera.rotation.set(0, 0, 0, 'YXZ')
      return
    }

    // ---- free flight ----
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    const k = keys.current
    const boost = k['ShiftLeft'] || k['ShiftRight']
    const speed = boost ? 75 : 28

    camera.getWorldDirection(dir)
    right.crossVectors(dir, camera.up).normalize()
    move.set(0, 0, 0)
    if (k['KeyW'] || k['ArrowUp']) move.add(dir)
    if (k['KeyS'] || k['ArrowDown']) move.sub(dir)
    if (k['KeyD'] || k['ArrowRight']) move.add(right)
    if (k['KeyA'] || k['ArrowLeft']) move.sub(right)
    if (k['KeyR'] || k['Space']) move.y += 1
    if (k['KeyF'] || k['ControlLeft']) move.y -= 1
    if (move.lengthSq() > 0) {
      camera.position.addScaledVector(move.normalize(), speed * dt)
    }
    // keep the ship inside the star field
    if (camera.position.length() > WORLD_RADIUS) {
      camera.position.setLength(WORLD_RADIUS)
    }
  })

  return null
}
