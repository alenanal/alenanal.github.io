import { useEffect, useMemo, useRef, useState } from 'react'
import { PageFlip } from 'page-flip'
import { BOOK, designProjects, assetBase } from './designContent'

// ---------------------------------------------------------------- helpers
const img = (id, file) => `${assetBase}/${id}/${file}`

// Every project's book layout, page by page. Each page is a list of
// blocks rendered under the title/text. Block kinds:
//   { gif: i }                       — hero GIF (index into files), fills space
//   { imgs: 'all' | [i...], cols }   — image grid, stretches to fill the page
//   { video: i, small? }             — one embedded video
//   { videos: true, small? }         — every video, stacked
//   { figma: true, small? }          — live Figma embed
//   { device: true }                 — floating phone/laptop from p.preview
const LAYOUTS = {
  crochet: [[{ imgs: 'all', cols: 3 }]],
  'dreaming-or-reality': [[{ gif: 1 }, { imgs: [0], cols: 1 }]],
  'water-bending': [[{ imgs: 'all', cols: 1 }]],
  mathlete: [[{ video: 0, small: true }, { imgs: 'all', cols: 1 }]],
  parachute: [[{ imgs: 'all', cols: 1 }]],
  'rubber-band-car': [[{ video: 0, small: true }, { imgs: 'all', cols: 2 }]],
  'sutd-cleans': [[{ imgs: 'all', cols: 1 }]],
  spatial: [[{ gif: 5 }], [{ gif: 6 }], [{ imgs: [0, 1, 2, 3, 4], cols: 2 }]],
  'block-box': [[{ video: 0, small: true }, { imgs: 'all', cols: 3 }]],
  'fee-fi-fumigation': [[{ video: 0, small: true }, { imgs: 'all', cols: 2 }]],
  root: [[{ imgs: 'all', cols: 1 }]],
  dsutd: [[{ imgs: [0, 1], cols: 2 }, { imgs: [2, 3, 4], cols: 3 }]],
  'what-the-hack': [[{ imgs: [0, 1, 2], cols: 3 }, { imgs: [3, 4], cols: 2 }]],
  uld: [[{ imgs: 'all', cols: 3 }]],
  'youth-tech-sg': [[{ imgs: 'all', cols: 2 }]],
  platefull: [[{ video: 0, small: true }, { imgs: 'all', cols: 3 }], [{ device: true }]],
  'loreal-brandstorm': [[{ imgs: 'all', cols: 1 }]],
  lifty: [[{ videos: true, small: true }]],
  cashi: [[{ device: true }]],
  athena: [[{ video: 0, small: true }, { figma: true, small: true }], [{ device: true }]],
  'bto-ai-mai': [[{ video: 0, small: true }, { figma: true, small: true }], [{ device: true }]],
  cura: [[{ imgs: [0, 1, 2], cols: 3 }, { imgs: [3, 4], cols: 2 }]],
}

function buildPages() {
  const pages = []
  const tocMap = {}
  pages.push({ type: 'cover' })
  pages.push({ type: 'toc' })
  for (const p of designProjects) {
    tocMap[p.id] = pages.length
    const layout = LAYOUTS[p.id] || [
      [...(p.videos?.length ? [{ videos: true, small: true }] : []), { imgs: 'all', cols: 2 }],
    ]
    layout.forEach((blocks, i) => pages.push({ type: 'proj', p, blocks, cont: i > 0 }))
  }
  pages.push({ type: 'back' })
  return { pages, tocMap }
}

// ---------------------------------------------------------------- pieces
function Lightbox({ src, onClose }) {
  return (
    <div className="db-lightbox" onClick={onClose}>
      <img src={src} alt="" />
      <p>click anywhere to close</p>
    </div>
  )
}

function ImageGrid({ p, indices, cols, onZoom }) {
  const files = indices === 'all' ? p.files : indices.map((i) => p.files[i])
  const spare = files.length % cols
  return (
    <div className="db-grid" style={{ '--cols': cols }}>
      {files.map((f, i) => (
        <img
          key={f}
          src={img(p.id, f)}
          alt={p.title}
          loading="lazy"
          style={i === files.length - 1 && spare ? { gridColumn: `span ${cols - spare + 1}` } : undefined}
          onClick={(e) => {
            e.stopPropagation()
            onZoom(img(p.id, f))
          }}
        />
      ))}
    </div>
  )
}

function Video({ id, label, title, small }) {
  return (
    <figure className={`db-videofig ${small ? 'small' : ''}`}>
      <div className="db-video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={label || title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {label && <figcaption>{label}</figcaption>}
    </figure>
  )
}

function FigmaFrame({ p, small }) {
  return (
    <div className={`db-figma ${small ? 'small' : ''}`}>
      <span className="db-preview-bar">
        <i />
        <i />
        <i />
        <em>figma.com</em>
        <a href={p.figma.open} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          Open in Figma ↗
        </a>
      </span>
      <iframe src={p.figma.embed} title="Figma file" loading="lazy" allowFullScreen />
    </div>
  )
}

// floating phone / laptop with the live app on screen (book edition)
function DeviceMock({ p }) {
  const pv = p.preview
  return (
    <div className="db-devwrap">
      <a
        className="db-float"
        href={pv.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the live app in a new tab"
        onClick={(e) => e.stopPropagation()}
      >
        {pv.device === 'phone' ? (
          <span className="db-dev db-phone">
            <span className="db-phone-notch" />
            <span className="db-phone-screen">
              <iframe src={pv.href} title={`${p.title} live`} loading="lazy" tabIndex={-1} aria-hidden="true" />
            </span>
            <span className="db-phone-home" />
          </span>
        ) : (
          <span className="db-dev db-laptop">
            <span className="db-laptop-screen">
              <iframe src={pv.href} title={`${p.title} live`} loading="lazy" tabIndex={-1} aria-hidden="true" />
            </span>
            <span className="db-laptop-base" />
          </span>
        )}
      </a>
      {pv.caption && <p className="db-caption">{pv.caption}</p>}
    </div>
  )
}

function ProjectHeader({ p, cont }) {
  return (
    <header className="db-head">
      {p.kicker && <p className="db-kicker">{p.kicker}</p>}
      <h3 className="db-title">
        {p.title}
        {cont && <span className="db-cont"> · continued</span>}
      </h3>
    </header>
  )
}

function Block({ b, p, onZoom }) {
  if (b.gif !== undefined) {
    const src = img(p.id, p.files[b.gif])
    return (
      <img
        className="db-hero"
        src={src}
        alt={p.title}
        loading="lazy"
        onClick={(e) => {
          e.stopPropagation()
          onZoom(src)
        }}
      />
    )
  }
  if (b.imgs) return <ImageGrid p={p} indices={b.imgs} cols={b.cols || 2} onZoom={onZoom} />
  if (b.video !== undefined) {
    const v = p.videos[b.video]
    return <Video id={v.id} label={v.label} title={p.title} small={b.small} />
  }
  if (b.videos)
    return (
      <div className="db-videos">
        {p.videos.map((v) => (
          <Video key={v.id} id={v.id} label={v.label} title={p.title} small={b.small} />
        ))}
      </div>
    )
  if (b.figma) return <FigmaFrame p={p} small={b.small} />
  if (b.device) return <DeviceMock p={p} />
  return null
}

function PageContent({ page, onZoom, onJump, onOpen, onClose }) {
  const p = page.p
  switch (page.type) {
    case 'cover':
      return (
        <div className="db-cover">
          <p className="db-cover-star">✦ ✦ ✦</p>
          <h2>{BOOK.coverTitle}</h2>
          <p className="db-cover-sub">{BOOK.coverSub}</p>
          <button
            className="db-open-btn"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
          >
            OPEN THE BOOK
          </button>
        </div>
      )
    case 'toc':
      return (
        <div className="db-toc">
          <h3>Table of Contents</h3>
          <ol>
            {designProjects.map((pr) => (
              <li key={pr.id}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onJump(pr.id)
                  }}
                >
                  {pr.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )
    case 'proj':
      return (
        <div className="db-project">
          <ProjectHeader p={p} cont={page.cont} />
          {!page.cont && p.text && <p className="db-text">{p.text}</p>}
          {page.blocks.map((b, i) => (
            <Block b={b} p={p} onZoom={onZoom} key={i} />
          ))}
          {!page.cont &&
            p.links?.map((l) => (
              <a
                key={l.href}
                className="db-link"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {l.label}
              </a>
            ))}
        </div>
      )
    case 'back':
      return (
        <div className="db-cover db-back">
          <p className="db-cover-star">✦</p>
          <p className="db-backline">{BOOK.backCover}</p>
          <button
            className="db-open-btn"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            RETURN TO THE STARS
          </button>
        </div>
      )
    default:
      return null
  }
}

// ---------------------------------------------------------------- the book
export default function DesignBook({ onClose }) {
  const { pages, tocMap } = useMemo(buildPages, [])
  const bookRef = useRef(null)
  const flipRef = useRef(null)
  const wrapRef = useRef(null)
  const [zoom, setZoom] = useState(null)
  const [pageNo, setPageNo] = useState(0)
  const total = pages.length


  // sparkles that burst from the spine on every page turn
  const sparkle = () => {
    const host = wrapRef.current
    if (!host) return
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span')
      s.className = 'db-spark'
      s.textContent = ['✦', '✧', '·', '✦'][i % 4]
      s.style.left = 46 + Math.random() * 8 + '%'
      s.style.top = 30 + Math.random() * 40 + '%'
      s.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px')
      s.style.setProperty('--dy', (Math.random() - 0.9) * 140 + 'px')
      s.style.fontSize = 8 + Math.random() * 10 + 'px'
      host.appendChild(s)
      setTimeout(() => s.remove(), 1300)
    }
  }

  // page-flip quirk: with disableFlipByClick on, even programmatic
  // flipNext/flipPrev silently bail (their synthetic point fails the
  // corner check) — so lift the flag just for the animated call
  const animated = (fn) => {
    const flip = flipRef.current
    if (!flip) return
    const settings = flip.getSettings()
    const saved = settings.disableFlipByClick
    settings.disableFlipByClick = false
    try {
      fn(flip)
    } finally {
      settings.disableFlipByClick = saved
    }
    // multi-page jumps only fire one 'flip' event — re-sync when settled
    setTimeout(() => {
      try {
        setPageNo(flip.getCurrentPageIndex())
      } catch {
        /* book closed mid-flight */
      }
    }, 950)
  }
  const flipFwd = () => animated((f) => f.flipNext())
  const flipBack = () => animated((f) => f.flipPrev())
  const jump = (id) => animated((f) => f.flip(tocMap[id]))

  // the skills of the open spread — each project's pills float on ITS
  // side of the book: left page's skills on the left, right page's on
  // the right. A project continuing across both pages splits its pills.
  const sideSkills = useMemo(() => {
    const skillsOf = (pg) => (pg?.type === 'proj' ? pg.p.skills || [] : [])
    const lp = pages[pageNo]
    const rp = pages[pageNo + 1]
    if (lp?.type === 'proj' && rp?.type === 'proj' && lp.p.id === rp.p.id) {
      const all = lp.p.skills || []
      const half = Math.ceil(all.length / 2)
      return { left: all.slice(0, half), right: all.slice(half) }
    }
    return { left: skillsOf(lp), right: skillsOf(rp) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo])

  useEffect(() => {
    // Deferred init, for two reasons: (1) StrictMode mounts, unmounts, and
    // remounts effects in dev — creating PageFlip immediately would let the
    // throwaway pass consume (and destroy) the page DOM before the real pass
    // runs; (2) PageFlip measures its container ONCE at creation, and when
    // the overlay opens over a heavy WebGL scene the flex layout may not
    // have settled yet — measuring 0 height sizes every page to 0×0
    // forever. So wait until the container has real dimensions.
    let flip = null
    let timer = 0
    let tries = 0
    const boot = () => {
      const el = bookRef.current
      if (!el) return
      if (el.getBoundingClientRect().height < 100 && tries++ < 60) {
        timer = setTimeout(boot, 50) // setTimeout, NOT rAF: it still fires in background tabs
        return
      }
      flip = new PageFlip(el, {
        width: 430,
        height: 590,
        size: 'stretch',
        minWidth: 280,
        maxWidth: 520,
        minHeight: 400,
        maxHeight: 720,
        showCover: true,
        usePortrait: false, // Alena's rule: the book is ALWAYS a two-page spread
        mobileScrollSupport: false,
        maxShadowOpacity: 0.45,
        showPageCorners: true,
        disableFlipByClick: true, // pages hold clickable media — use drag/corners/arrows
        flippingTime: 850,
      })
      flip.loadFromHTML(bookRef.current.querySelectorAll('.db-page'))
      flip.on('flip', (e) => {
        setPageNo(e.data)
        sparkle()
      })
      flipRef.current = flip
      window.__designBookFlip = flip // debug handle; harmless in production
      // belt-and-braces: poke the lib's resize listener once settled
      setTimeout(() => window.dispatchEvent(new Event('resize')), 200)
    }
    timer = setTimeout(boot, 30)

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') flipFwd()
      if (e.key === 'ArrowLeft') flipBack()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      try {
        flip?.destroy()
      } catch {
        /* already gone */
      }
      flipRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="db-overlay">
      <div className="db-stars l1" />
      <div className="db-stars l2" />
      <div className="db-nebula" />
      <span className="db-shoot s1" />
      <span className="db-shoot s2" />
      <span className="db-shoot s3" />
      <button className="db-close" onClick={onClose} aria-label="Close the book">×</button>

      <div className="db-book-wrap" ref={wrapRef}>
        {(sideSkills.left.length > 0 || sideSkills.right.length > 0) && (
          <div className="db-skill-cloud" key={`skills-${pageNo}`} aria-hidden="true">
            {['left', 'right'].map((side) =>
              sideSkills[side].map((s, i) => (
                <span
                  className={`db-skill-anchor is-${side}`}
                  key={`${side}-${s}`}
                  style={{ top: `${12 + i * 14}%` }}
                >
                  <span
                    className="db-skill-pill"
                    style={{
                      '--fx': side === 'left' ? '22vw' : '-22vw',
                      '--fy': `${12 - i * 5}vh`,
                      '--delay': `${i * 0.13}s`,
                      '--bob': `${3.6 + (i % 3) * 0.7}s`,
                    }}
                  >
                    ✦ {s}
                  </span>
                </span>
              )),
            )}
          </div>
        )}
        <div className="db-book" ref={bookRef}>
          {pages.map((page, i) => (
            <div
              className={`db-page ${page.type === 'cover' || page.type === 'back' ? 'db-page-cover' : ''}`}
              key={i}
              data-density={page.type === 'cover' || page.type === 'back' ? 'hard' : 'soft'}
            >
              <div className="db-page-inner">
                <PageContent page={page} onZoom={setZoom} onJump={jump} onOpen={flipFwd} onClose={onClose} />
                {page.type !== 'cover' && page.type !== 'back' && <span className="db-page-num">{i}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="db-nav">
        <button onClick={flipBack} aria-label="Previous page">‹</button>
        <span>
          Page {Math.min(pageNo + 1, total)} of {total}
        </span>
        <button onClick={flipFwd} aria-label="Next page">›</button>
      </div>
      <p className="db-help">drag a page corner · arrow keys · or use the arrows — ESC to leave</p>

      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  )
}
