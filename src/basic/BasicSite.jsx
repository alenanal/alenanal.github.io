// ============================================================
//  THE QUICK VERSION — a classic tabbed website for visitors
//  (and hirers) who don't have time to fly a spaceship.
//  Home is a landing page; every section lives on its own tab.
//  All content comes from src/content.js + src/designContent.js —
//  the exact same source the 3D site uses.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { profile, sections, sectionOrder } from '../content'
import { designProjects, assetBase } from '../designContent'

const img = (id, file) => `${assetBase}/${id}/${file}`
const TABS = ['home', ...sectionOrder]

// ---------------------------------------------- scroll reveals
function useReveals(dep) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [dep])
}

// --------------------- water-ripple + stardust trail on the cursor
function RippleField() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    const ripples = []
    const sparks = []
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    const onMove = (e) => {
      const now = performance.now()
      if (now - last < 26) return
      last = now
      ripples.push({ x: e.clientX, y: e.clientY, r: 2, a: 0.55 })
      for (let i = 0; i < 2; i++) {
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.4,
          vy: (Math.random() - 0.5) * 1.4 - 0.35,
          a: 1,
          s: 0.8 + Math.random() * 1.8,
        })
      }
      if (ripples.length > 60) ripples.shift()
      if (sparks.length > 120) sparks.shift()
    }
    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const p = ripples[i]
        p.r += 1.7
        p.a *= 0.955
        if (p.a < 0.012) {
          ripples.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, 6.2832)
        ctx.strokeStyle = `rgba(125, 227, 240, ${p.a})`
        ctx.lineWidth = 1.4
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 0.55, 0, 6.2832)
        ctx.strokeStyle = `rgba(255, 214, 140, ${p.a * 0.55})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx
        s.y += s.vy
        s.a *= 0.955
        if (s.a < 0.02) {
          sparks.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.s, 0, 6.2832)
        ctx.fillStyle = `rgba(255, 233, 176, ${s.a * 0.8})`
        ctx.fill()
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])
  return <canvas className="b-ripples" ref={ref} aria-hidden="true" />
}

// ------------------------- extra blinking stars for the home page
function TwinkleField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        dur: 1.6 + Math.random() * 3.4,
        size: 6 + Math.random() * 12,
        glyph: i % 4 === 0 ? '✦' : i % 4 === 1 ? '✧' : '·',
      })),
    [],
  )
  return (
    <div className="b-twinkles" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        >
          {s.glyph}
        </span>
      ))}
    </div>
  )
}

// --------------------------------- lightweight click-to-play video
function VideoLite({ id, label }) {
  const [playing, setPlaying] = useState(false)
  return playing ? (
    <div className="b-video playing">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title={label || 'video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  ) : (
    <button
      className="b-video"
      onClick={() => setPlaying(true)}
      style={{ backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)` }}
      aria-label={`Play ${label || 'video'}`}
    >
      <span className="b-play">▶</span>
      {label && <span className="b-video-label">{label}</span>}
    </button>
  )
}

// ------------------------------------------------ content blocks
function Block({ block }) {
  return (
    <div className="b-block reveal">
      <h3 className="b-block-heading">{block.heading}</h3>
      {block.text && <p className="b-text">{block.text}</p>}
      {block.list && (
        <ul className="b-list">
          {block.list.map((li) => (
            <li key={li}>{li}</li>
          ))}
        </ul>
      )}
      {block.entries && (
        <div className="b-entries">
          {block.entries.map((en) => (
            <article className="b-entry" key={en.title}>
              <h4 className="b-entry-title">
                {en.link ? (
                  <a href={en.link} target="_blank" rel="noopener noreferrer">
                    {en.title} ↗
                  </a>
                ) : (
                  en.title
                )}
              </h4>
              {en.meta && <p className="b-entry-meta">{en.meta}</p>}
              {en.role && (
                <p className="b-entry-role">
                  <span>my role</span>
                  {en.role}
                </p>
              )}
              {en.detail && <p className="b-entry-detail">{en.detail}</p>}
              {en.videos && (
                <div className={`b-videos ${en.videos.length > 1 ? 'dual' : ''}`}>
                  {en.videos.map((v) => (
                    <VideoLite key={v.id} id={v.id} label={v.label} />
                  ))}
                </div>
              )}
              <div className="b-links">
                {en.mockup?.href && (
                  <a className="b-btn" href={en.mockup.href} target="_blank" rel="noopener noreferrer">
                    {en.mockup.type === 'phone' ? 'Launch the app ↗' : 'Explore the live dashboard ↗'}
                  </a>
                )}
                {en.mockups?.map((m) => (
                  <a className="b-btn" key={m.href} href={m.href} target="_blank" rel="noopener noreferrer">
                    {m.type === 'browser' ? 'Read the case study ↗' : 'Explore the live dashboard ↗'}
                  </a>
                ))}
                {en.links?.map((l) => (
                  <a className="b-btn ghost" key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------- design work cards
function DesignCard({ p }) {
  const cover = p.files?.length ? img(p.id, p.files[0]) : null
  const videoThumb = !cover && p.videos?.length ? `https://i.ytimg.com/vi/${p.videos[0].id}/hqdefault.jpg` : null
  return (
    <article className="b-card reveal">
      <div
        className="b-card-cover"
        style={cover || videoThumb ? { backgroundImage: `url(${cover || videoThumb})` } : undefined}
      >
        {!cover && !videoThumb && <span className="b-card-star">✦</span>}
      </div>
      <div className="b-card-body">
        <p className="b-kicker">{p.kicker}</p>
        <h4 className="b-card-title">{p.title}</h4>
        <p className="b-card-text">{p.text}</p>
        {p.skills && (
          <div className="b-pills">
            {p.skills.map((s) => (
              <span className="b-pill" key={s}>
                ✦ {s}
              </span>
            ))}
          </div>
        )}
        <div className="b-links">
          {p.videos?.map((v) => (
            <a
              className="b-btn ghost"
              key={v.id}
              href={`https://youtu.be/${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ▶ {v.label || 'Watch the video'}
            </a>
          ))}
          {p.preview && (
            <a className="b-btn" href={p.preview.href} target="_blank" rel="noopener noreferrer">
              {p.preview.device === 'phone' ? 'Launch the app ↗' : 'Explore live ↗'}
            </a>
          )}
          {p.figma && (
            <a className="b-btn ghost" href={p.figma.open} target="_blank" rel="noopener noreferrer">
              Open in Figma ↗
            </a>
          )}
          {p.links?.map((l) => (
            <a className="b-btn ghost" key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

// ------------------------------------------------------- the page
export default function BasicSite() {
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1)
    return TABS.includes(h) ? h : 'home'
  })
  useReveals(tab)
  useEffect(() => {
    window.history.replaceState(null, '', tab === 'home' ? '#' : `#${tab}`)
    window.scrollTo(0, 0)
  }, [tab])

  const navRef = useRef(null)
  useEffect(() => {
    const onScroll = () => navRef.current?.classList.toggle('scrolled', window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const s = tab !== 'home' ? sections[tab] : null

  return (
    <div className="basic">
      <div className="b-stars l1" aria-hidden="true" />
      <div className="b-stars l2" aria-hidden="true" />
      {tab === 'home' && <div className="b-stars l3" aria-hidden="true" />}
      {tab === 'home' && <TwinkleField />}
      {tab === 'home' && <RippleField />}

      <nav className="b-nav" ref={navRef}>
        <button className="b-logo" onClick={() => setTab('home')}>
          ALENA
        </button>
        <div className="b-nav-links">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
            Home
          </button>
          {sectionOrder.map((id) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              <i>{sections[id].num}</i> {sections[id].label}
            </button>
          ))}
        </div>
        <a className="b-btn small" href="/">
          🚀 Full experience
        </a>
      </nav>

      {tab === 'home' ? (
        <header className="b-hero" key="home">
          <p className="b-hero-kicker reveal">design &amp; ai @ sutd · {profile.callsign.toLowerCase()}</p>
          <h1 className="b-hero-name reveal">{profile.name}</h1>
          <p className="b-hero-tag reveal">{profile.tagline}</p>
          <div className="b-hero-cta reveal">
            <button className="b-btn" onClick={() => setTab('moon')}>
              See my projects
            </button>
          </div>
          <p className="b-hero-hint reveal">
            prefer an adventure? <a href="/">fly the interactive version →</a>
          </p>
        </header>
      ) : (
        <main key={tab}>
          <section className="b-section" id={tab}>
            <header className="b-section-head reveal">
              <span className="b-section-num">{s.num}</span>
              <h2 className="b-section-title">{s.label}</h2>
              <p className="b-section-tagline">{s.tagline}</p>
            </header>

            {tab === 'sun' && s.photo && (
              <img className="b-photo reveal" src={profile.photo} alt={profile.name} loading="lazy" />
            )}

            {s.blocks.map((b, i) => (
              <Block block={b} key={i} />
            ))}

            {tab === 'jupiter' && (
              <div className="b-cards">
                {designProjects.map((p) => (
                  <DesignCard p={p} key={p.id} />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="b-footer reveal in">
        <p className="b-footer-quote">“You only live once. Try everything, regret nothing.”</p>
        <div className="b-links center">
          <a className="b-btn" href="mailto:email2alenalim@gmail.com">
            Email me
          </a>
          <a
            className="b-btn ghost"
            href="https://www.linkedin.com/in/alena-lim-9aa7762a9/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn ↗
          </a>
          <a className="b-btn ghost" href="/">
            🚀 Fly the full mission
          </a>
        </div>
        <p className="b-footer-fine">made with love (and a small spaceship) · © {new Date().getFullYear()} Alena</p>
      </footer>
    </div>
  )
}
