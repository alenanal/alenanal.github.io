import { useEffect, useState } from 'react'
import { profile, sections, sectionOrder } from './content'
import { timeOfDayNow } from './LaunchScenes'

// ------------------------------------ backdrop (sky) picker
const SKY_ICONS = { day: '☀', sunset: '🌅', night: '☾' }
export function SkyPicker({ mode, onChange }) {
  const autoNow = timeOfDayNow()
  const options = [
    ['auto', `◐ AUTO · ${autoNow.toUpperCase()}`],
    ['day', `${SKY_ICONS.day} DAY`],
    ['sunset', `${SKY_ICONS.sunset} SUNSET`],
    ['night', `${SKY_ICONS.night} NIGHT`],
  ]
  return (
    <div className="sky-picker">
      <p className="sky-picker-title">BACKDROP</p>
      {options.map(([value, label]) => (
        <button
          key={value}
          className={`sky-picker-btn ${mode === value ? 'active' : ''}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------- minimal title card
export function TitleCard() {
  return (
    <div className="title-card">
      <h1>{profile.name}</h1>
      <p>welcome to my portfolio</p>
    </div>
  )
}

// ------------------------- flight instructions, after leaving warp
export function FlightGuide({ onDismiss }) {
  return (
    <div className="flight-guide">
      <p className="briefing-kicker">FLIGHT CONTROLS ONLINE</p>
      <ul className="briefing-list">
        <li><b>DRAG</b> to look · <b>W / S</b> thrust · <b>A / D</b> strafe</li>
        <li><b>SPACE / CTRL</b> rise &amp; dive · <b>SHIFT</b> boost</li>
        <li>Fly <b>closer to a planet</b> until its name appears, then <b>click it</b> to find out more</li>
      </ul>
      <button className="guide-btn" onClick={onDismiss}>START EXPLORING</button>
    </div>
  )
}

// welcome screen for the hidden lantern world
export function LanternGuide({ onDismiss }) {
  return (
    <div className="flight-guide lantern-guide">
      <p className="briefing-kicker gold">✦ THE HIDDEN WORLD ✦</p>
      <p className="briefing-text">
        You pressed the button nobody should press — so the ship brought you where
        her dreams are kept: a night where the sky rains light. She has always
        loved the floating lanterns.
      </p>
      <ul className="briefing-list">
        <li><b>DRAG</b> to look around · <b>W / S</b> row the boat · <b>A / D</b> drift</li>
        <li>The lanterns &amp; trinkets that <b>pulse with light</b> hold her story — click them</li>
        <li>Row toward the <b>castle</b> if you dare · <b>RETURN TO YOUR SHIP</b> is top-right</li>
      </ul>
      <button className="guide-btn gold" onClick={onDismiss}>
        STEP INTO THE DREAM
      </button>
    </div>
  )
}

// white flash when dropping out of warp
export function WarpFlash() {
  return <div className="warp-flash" />
}

// --------------------------------------------------------------- HUD
export function Hud({ onSelect, discovered, mode }) {
  return (
    <>
      <div className="vignette" />
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />

      <div className="hud-patch">
        <span className="hud-patch-name">{profile.name}</span>
        <span className="hud-patch-sub">{profile.callsign}</span>
      </div>

      {/* missions mini-screen: destinations stay UNCHARTED until visited */}
      <nav className="missions">
        <p className="missions-title">
          <span className="missions-dot" /> MISSION LOG · {discovered.length}/05
        </p>
        {sectionOrder.map((id) => {
          const found = discovered.includes(id)
          return found ? (
            <button key={id} className="missions-item" onClick={() => onSelect(id)}>
              <span className="missions-num">{sections[id].num}</span>
              <span className="missions-label">{sections[id].label}</span>
              <span className="missions-open">OPEN ▸</span>
            </button>
          ) : (
            <div key={id} className="missions-item locked">
              <span className="missions-num">{sections[id].num}</span>
              <span className="missions-label">UNCHARTED</span>
              <span className="missions-open">fly closer</span>
            </div>
          )
        })}
      </nav>

      <div className="hud-help">
        {mode === 'lantern' ? (
          <>
            <span>DRAG look</span>
            <span>W/S row</span>
            <span>A/D drift</span>
            <span>click the lanterns &amp; trinkets</span>
          </>
        ) : (
          <>
            <span>DRAG look</span>
            <span>W/S thrust</span>
            <span>A/D strafe</span>
            <span>SPACE/CTRL up·down</span>
            <span>SHIFT boost</span>
          </>
        )}
      </div>

      <div className="crosshair">+</div>
    </>
  )
}

// ------------------------------------------------------- photo frame
function Photo() {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="photo-placeholder">
        <span>YOUR PHOTO HERE</span>
        <small>save a picture as me.jpg inside the public folder</small>
      </div>
    )
  }
  return (
    <img
      className="panel-photo"
      src={profile.photo}
      alt={profile.name}
      onError={() => setFailed(true)}
    />
  )
}

// ---------------------------- embedded videos (privacy-enhanced)
const VIDEO_CREDIT =
  'All videos directed, written, filmed and edited by yours truly — me, and me only.'

function EntryVideos({ videos, title }) {
  return (
    <>
      <div className={`entry-videos ${videos.length > 1 ? 'dual' : ''}`}>
        {videos.map((v) => (
          <figure className="video-figure" key={v.id}>
            <div className="video-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                title={v.label ? `${title} — ${v.label}` : title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            {v.label && <figcaption className="video-label">{v.label}</figcaption>}
          </figure>
        ))}
      </div>
      <p className="video-credit">{VIDEO_CREDIT}</p>
    </>
  )
}

// --------------------- floating device mockups (phone & laptop)
function PhoneMockup({ mockup }) {
  const [imgFailed, setImgFailed] = useState(false)
  const useImage = mockup.image && !imgFailed
  return (
    <div className="mockup-wrap">
      <a
        className="mockup-float"
        href={mockup.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the app in a new tab"
      >
        <span className="device phone-device">
          <span className="phone-notch" />
          <span className="phone-screen">
            {useImage ? (
              <img
                src={mockup.image}
                alt="App screenshot"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <iframe
                className="phone-iframe"
                src={mockup.iframe}
                title="Live app preview"
                loading="lazy"
                tabIndex={-1}
                aria-hidden="true"
              />
            )}
          </span>
          <span className="phone-home" />
        </span>
      </a>
      {mockup.caption && <p className="mockup-caption">{mockup.caption}</p>}
    </div>
  )
}

function LaptopMockup({ mockup }) {
  return (
    <div className="mockup-wrap">
      <a
        className="mockup-float"
        href={mockup.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the app in a new tab"
      >
        <span className="device laptop-device">
          <span className="laptop-screen">
            <iframe
              className="laptop-iframe"
              src={mockup.iframe}
              title="Live app preview"
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
            />
          </span>
          <span className="laptop-base" />
        </span>
      </a>
      {mockup.caption && <p className="mockup-caption">{mockup.caption}</p>}
    </div>
  )
}

function BrowserMockup({ mockup }) {
  return (
    <div className="mockup-wrap">
      <a
        className="mockup-float"
        href={mockup.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the website in a new tab"
      >
        <span className="device browser-device" data-hint={mockup.hint || 'OPEN ↗'}>
          <span className="browser-bar">
            <span className="browser-dot" />
            <span className="browser-dot" />
            <span className="browser-dot" />
            {mockup.url && <span className="browser-url">{mockup.url}</span>}
          </span>
          <img className="browser-shot" src={mockup.image} alt="Website preview" loading="lazy" />
        </span>
      </a>
      {mockup.caption && <p className="mockup-caption">{mockup.caption}</p>}
    </div>
  )
}

const MOCKUP_KINDS = { phone: PhoneMockup, laptop: LaptopMockup, browser: BrowserMockup }

// ------------------------------------ dossier: big centered page
export function InfoPanel({ id, onClose }) {
  const s = sections[id]

  useEffect(() => {
    const onKey = (e) => (e.code === 'Escape' || e.key === 'Escape') && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <aside className="panel">
        <header className="panel-header">
          <div>
            <h2 className="panel-title">{s.label}</h2>
            <p className="panel-tagline">{s.tagline}</p>
          </div>
          <button className="panel-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="panel-body">
          {s.photo && <Photo />}
          {s.blocks.map((b, i) => (
            <section className="panel-block" key={i}>
              {b.heading && <h3 className="block-heading">{b.heading}</h3>}
              {b.text && <p className="block-text">{b.text}</p>}
              {b.list && (
                <ul className="block-list">
                  {b.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
              {b.entries &&
                b.entries.map((en, j) => (
                  <article className="block-entry" key={j}>
                    <h4 className="entry-title">{en.title}</h4>
                    {en.meta && <p className="entry-meta">{en.meta}</p>}
                    {en.role && (
                      <p className="entry-role">
                        <span className="entry-role-kicker">my role</span>
                        {en.role}
                      </p>
                    )}
                    {en.videos && <EntryVideos videos={en.videos} title={en.title} />}
                    {en.detail && <p className="entry-detail">{en.detail}</p>}
                    {(en.mockups || (en.mockup ? [en.mockup] : [])).map((m, k) => {
                      const Mockup = MOCKUP_KINDS[m.type]
                      return Mockup ? <Mockup mockup={m} key={k} /> : null
                    })}
                    {en.link && !en.link.includes('✏️') && (
                      <a className="entry-link" href={en.link} target="_blank" rel="noreferrer">
                        OPEN LINK ↗
                      </a>
                    )}
                    {en.links &&
                      en.links.map((l, k) => (
                        <a
                          className="entry-textlink"
                          key={k}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {l.label}
                        </a>
                      ))}
                  </article>
                ))}
            </section>
          ))}
          <p className="panel-footer">ESC · × · or click outside to return to flight</p>
        </div>
      </aside>
    </>
  )
}
