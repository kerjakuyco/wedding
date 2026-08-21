import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Particles from './Particles.jsx'
import WhiteLilyDecor from './WhiteLilyDecor.jsx'
import './App.css'

const WEDDING_DATE = new Date('2026-10-17T11:00:00+07:00')
const MAPS_URL = 'https://share.google/N1498OtR3jMvBXDPH'

const ACCOUNTS = [
  { bank: 'Blu by BCA Digital', number: '001504549754', holder: 'Putri Ewing Vai' },
  { bank: 'BCA', number: '7651120491', holder: 'Muhammad Azzohabi' },
]

function getRemaining(target) {
  const diff = target - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through */ }
  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(field)
    return ok
  } catch {
    return false
  }
}

/* ---------- shared decorative components ---------- */

function MiniCalendar() {
  const dates = [12, 13, 14, 15, 16, 17, 18]
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <div className="mini-cal" aria-hidden="true">
      <p className="mini-cal-month">Oktober <span>2026</span></p>
      <div className="mini-cal-strip">
        {dates.map((d, i) => (
          <span key={d} className={`mini-cal-day${d === 17 ? ' is-wedding' : ''}`}>
            <span className="mini-cal-dow">{labels[i]}</span>
            <span className="mini-cal-num">
              {d}
              {d === 17 && (
                <svg className="mini-cal-badge" viewBox="0 0 20 18" width="9" height="8">
                  <path d="M10,17 C2,11 0,7 0,4 C0,1.5 2,0 4,0 C5.5,0 7.5,1 10,3 C12.5,1 14.5,0 16,0 C18,0 20,1.5 20,4 C20,7 18,11 10,17Z"
                    fill="var(--rose)" opacity="1" />
                </svg>
              )}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Ornament({ d = 0 }) {
  return (
    <div className="slide-child" style={{ '--d': d }}>
      <div className="ornament" aria-hidden="true">
        <span className="ornament-line" />
        <svg className="ornament-heart" viewBox="0 0 12 11" width="10" height="9">
          <path d="M6,10 C1.5,6.5 0,4 0,2.5 C0,1 1.2,0 2.5,0 C3.5,0 4.5,0.5 6,2 C7.5,0.5 8.5,0 9.5,0 C10.8,0 12,1 12,2.5 C12,4 10.5,6.5 6,10Z"
            fill="currentColor" />
        </svg>
        <span className="ornament-line" />
      </div>
    </div>
  )
}

const SIDE_WAVE_SHAPES = {
  quote: [
    [68, 8, 65, 4, 58],
    [76, 18, 70, 14, 66],
    [84, 31, 78, 27, 74],
  ],
  couple: [
    [55, -4, 72, 10, 62],
    [70, 12, 80, 22, 74],
    [82, 26, 67, 8, 80],
  ],
  event: [
    [74, 2, 52, -8, 68],
    [82, 19, 61, 5, 75],
    [69, 8, 84, 24, 62],
  ],
  countdown: [
    [50, -5, 76, 18, 48],
    [64, 5, 84, 28, 61],
    [78, 20, 58, 0, 82],
  ],
  gifts: [
    [80, 15, 63, -4, 72],
    [67, 0, 78, 16, 54],
    [90, 30, 70, 10, 86],
  ],
  footer: [
    [58, -6, 68, 4, 60],
    [72, 9, 56, -2, 76],
    [84, 24, 74, 14, 64],
  ],
}

function buildWavePath(startX, [a, b, c, d, e]) {
  return `M ${startX} -10 C ${startX} 40, ${a} 75, ${a} 145 S ${b} 245, ${b} 300 S ${c} 390, ${c} 460 S ${d} 560, ${d} 630 S ${e} 735, ${e} 780 C ${e} 840, ${startX} 855, ${startX} 910`
}

function SideWave({ variant }) {
  const lanes = [12, 36, 60]

  return (
    <div className="wave-left" aria-hidden="true">
      <svg viewBox="0 0 80 900" preserveAspectRatio="none">
        {SIDE_WAVE_SHAPES[variant].map((shape, index) => (
          <path key={index} className={`wave-path wave-path--${index + 1}`}
            d={buildWavePath(lanes[index], shape)} />
        ))}
      </svg>
    </div>
  )
}

/* ---------- content components ---------- */

function Countdown() {
  const [remaining, setRemaining] = useState(() => getRemaining(WEDDING_DATE))

  useEffect(() => {
    if (!remaining) return undefined
    const id = setInterval(() => {
      const next = getRemaining(WEDDING_DATE)
      setRemaining(next)
      if (!next) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (!remaining) return null

  const cells = [
    { label: 'Hari', value: remaining.days },
    { label: 'Jam', value: remaining.hours },
    { label: 'Menit', value: remaining.minutes },
    { label: 'Detik', value: remaining.seconds },
  ]

  return (
    <div className="countdown">
      {cells.map(({ label, value }) => (
        <div className="cd-cell" key={label}>
          <span className="cd-num">{String(value).padStart(2, '0')}</span>
          <span className="cd-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const id = setTimeout(() => setCopied(false), 2200)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      className={copied ? 'copy is-copied' : 'copy'}
      onClick={async () => {
        if (await copyText(value)) setCopied(true)
      }}
    >
      <svg className="copy-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      {copied ? 'Tersalin' : 'Salin'}
      <span className="visually-hidden"> nomor rekening {label}</span>
    </button>
  )
}

function MusicToggle() {
  const audioRef = useRef(null)
  const contextRef = useRef(null)
  const sourceRef = useRef(null)
  const useWebAudioRef = useRef(false)
  const pendingPlayRef = useRef(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      return undefined
    }

    const context = new AudioContextClass()
    contextRef.current = context
    useWebAudioRef.current = true
    let disposed = false

    const unlock = () => {
      if (!pendingPlayRef.current || context.state === 'running') return
      context.resume().then(() => {
        if (!disposed) setPlaying(context.state === 'running')
      }).catch(() => {})
    }

    window.addEventListener('pointerdown', unlock, { capture: true, once: true })
    window.addEventListener('keydown', unlock, { capture: true, once: true })

    const load = async () => {
      try {
        const response = await fetch('/music.mp3')
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`)
        const buffer = await context.decodeAudioData(await response.arrayBuffer())
        if (disposed) return

        const source = context.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.loopStart = 0
        source.loopEnd = buffer.duration
        source.connect(context.destination)
        source.start(0)
        sourceRef.current = source

        if (pendingPlayRef.current) await context.resume().catch(() => {})
        if (!disposed) setPlaying(context.state === 'running')
      } catch {
        if (disposed) return
        useWebAudioRef.current = false
        contextRef.current = null
        context.close().catch(() => {})
        audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      }
    }

    load()

    return () => {
      disposed = true
      window.removeEventListener('pointerdown', unlock, { capture: true })
      window.removeEventListener('keydown', unlock, { capture: true })
      try { sourceRef.current?.stop() } catch { /* source may already be stopped */ }
      context.close().catch(() => {})
    }
  }, [])

  const toggle = async () => {
    if (useWebAudioRef.current) {
      const context = contextRef.current
      if (!context) return
      if (playing) {
        pendingPlayRef.current = false
        await context.suspend()
        setPlaying(false)
      } else {
        pendingPlayRef.current = true
        await context.resume()
        setPlaying(context.state === 'running')
      }
      return
    }

    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  return (
    <>
      <audio ref={audioRef} src="/music.mp3" loop preload="auto" />
      <button type="button" className="music" onClick={toggle} aria-pressed={playing} aria-label={playing ? 'Hentikan musik' : 'Putar musik'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          {playing ? (
            <>
              <rect x="7" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none" />
              <rect x="13.8" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none" />
            </>
          ) : (
            <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" stroke="none" />
          )}
        </svg>
      </button>
    </>
  )
}

/* ---------- slide labels ---------- */

const SLIDE_LABELS = {
  hero: 'Pembuka',
  quote: 'Kutipan',
  couple: 'Mempelai',
  event: 'Acara',
  countdown: 'Countdown',
  gifts: 'Tanda Kasih',
  footer: 'Penutup',
}

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const hasCountdown = useMemo(() => !!getRemaining(WEDDING_DATE), [])

  const slideIds = useMemo(() => {
    const ids = ['hero', 'quote', 'couple', 'event']
    if (hasCountdown) ids.push('countdown')
    ids.push('gifts', 'footer')
    return ids
  }, [hasCountdown])

  const totalSlides = slideIds.length

  const [activeSlide, setActiveSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStartY, setTouchStartY] = useState(null)

  /* navigation */
  const goToSlide = useCallback((index) => {
    if (index < 0 || index >= totalSlides) return
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveSlide(index)
    setTimeout(() => setIsTransitioning(false), 1050)
  }, [totalSlides, isTransitioning])

  useEffect(() => {
    let cooldown = false
    const handler = (e) => {
      if (cooldown) { e.preventDefault(); return }
      if (Math.abs(e.deltaY) < 20) return
      cooldown = true
      setTimeout(() => { cooldown = false }, 1100)
      e.preventDefault()
      if (e.deltaY > 0) goToSlide(activeSlide + 1)
      else goToSlide(activeSlide - 1)
    }
    window.addEventListener('wheel', handler, { passive: false })
    return () => window.removeEventListener('wheel', handler)
  }, [activeSlide, goToSlide])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goToSlide(activeSlide + 1) }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goToSlide(activeSlide - 1) }
      else if (e.key === 'Home') { e.preventDefault(); goToSlide(0) }
      else if (e.key === 'End') { e.preventDefault(); goToSlide(totalSlides - 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeSlide, goToSlide, totalSlides])

  const handleTouchStart = useCallback((e) => { setTouchStartY(e.touches[0].clientY) }, [])
  const handleTouchEnd = useCallback((e) => {
      if (touchStartY === null) return
    const diff = touchStartY - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToSlide(activeSlide + 1)
      else goToSlide(activeSlide - 1)
    }
    setTouchStartY(null)
  }, [touchStartY, activeSlide, goToSlide])

  const slideTransform = useCallback((i) => `translateY(${(i - activeSlide) * 100}%)`, [activeSlide])

  const slideClass = (idx) => {
    let cls = 'slide'
    if (idx === activeSlide) cls += ' is-active'
    else if (idx > activeSlide) cls += ' is-below'
    else cls += ' is-above'
    return cls
  }

  return (
    <>
      <a className="skip" href="#isi">Lompat ke isi undangan</a>
      <MusicToggle />

      <button
        className="nav-arrow"
        onClick={() => goToSlide((activeSlide + 1) % totalSlides)}
        aria-label={activeSlide === totalSlides - 1 ? 'Kembali ke slide pertama' : 'Slide berikutnya'}
        type="button"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
          {activeSlide === totalSlides - 1 ? (
            <path d="M18 15l-6-6-6 6" />
          ) : (
            <path d="M6 9l6 6 6-6" />
          )}
        </svg>
      </button>
      <Particles />

      {slideIds.slice(1).map((id) => (
        <WhiteLilyDecor key={id} variant={id} active={slideIds[activeSlide] === id} />
      ))}

      <nav className="slides-nav" aria-label="Navigasi slide">
        {slideIds.map((id, i) => (
          <button key={id} type="button" className={`slides-dot${i === activeSlide ? ' is-active' : ''}`}
            onClick={() => goToSlide(i)}
            aria-label={`${SLIDE_LABELS[id]} (slide ${i + 1} dari ${totalSlides})`}
            aria-current={i === activeSlide ? 'step' : undefined}
          />
        ))}
      </nav>

      <div className="slides-container" id="isi" role="main" tabIndex={-1}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* ---- hero (0) ---- */}
        <div className={slideClass(0)} style={{ transform: slideTransform(0) }}>
          <header className="hero">
            <span className="hero-corner hero-corner--tl" aria-hidden="true" />
            <span className="hero-corner hero-corner--tr" aria-hidden="true" />
            <span className="hero-corner hero-corner--bl" aria-hidden="true" />
            <div className="hero-inner">
              <span className="eyebrow slide-child" style={{ '--d': 0 }}>You&rsquo;re invited to the wedding of</span>
              <img className="hero-logo slide-child" src="/logo.png" alt="Azzohabi &amp; Putri" style={{ '--d': 1 }} />
              <p className="hero-meta slide-child" style={{ '--d': 2 }}>Sabtu, 17 Oktober 2026</p>
              <p className="hero-place slide-child" style={{ '--d': 3 }}>Depok, Jawa Barat</p>
              <button className="btn slide-child" style={{ '--d': 4 }} onClick={() => goToSlide(1)} type="button">
                <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
                Buka Undangan
              </button>
            </div>
            <span className="hero-cue" aria-hidden="true" />
          </header>
        </div>

        {/* ---- quote (1) ---- */}
        <div className={`${slideClass(1)} slide--ornament`} style={{ transform: slideTransform(1) }}>
          <span className="corner-bl" aria-hidden="true" />
          <section className="section section--glow">
            <SideWave variant="quote" />
            <div className="wrap narrow">
              <div className="quote-frame slide-child" style={{ '--d': 0 }}>
                <span className="quote-mark" aria-hidden="true">&ldquo;</span>
                <blockquote className="quote">
                  Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan
                  untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan
                  merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan&nbsp;sayang.
                </blockquote>
                <p className="quote-source">QS. Ar-Rum: 21</p>
              </div>
            </div>
          </section>
        </div>

        {/* ---- couple (2) ---- */}
         <div className={`${slideClass(2)} slide--ornament`} style={{ transform: slideTransform(2) }}>
          <span className="corner-bl" aria-hidden="true" />
          <section className="section section--paper section--couple" aria-labelledby="mempelai">
            <SideWave variant="couple" />
            <div className="wrap">
              <span className="eyebrow slide-child" style={{ '--d': 0 }}>With Love</span>
              <h2 className="h2 h2--bg slide-child" id="mempelai" style={{ '--d': 1 }}>The Groom &amp; Bride</h2>
              <Ornament d={2} />
              <div className="couple slide-child" style={{ '--d': 3 }}>
                <div>
                  <p className="person-name">Muhammad Azzohabi</p>
                  <hr className="rule-draw rule--tight" aria-hidden="true" />
                  <p className="person-of">Putra Pertama dari</p>
                  <p className="person-parents">Alm. Abdi Rohman bin Akram<br />&amp;<br />Soleha</p>
                </div>
                <span className="couple-amp" aria-hidden="true">&amp;</span>
                <div>
                  <p className="person-name">Putri Ewing Vai</p>
                  <hr className="rule-draw rule--tight" aria-hidden="true" />
                  <p className="person-of">Putri Ketiga dari</p>
                  <p className="person-parents">Moh. Hamim bin Ahmad Jaelani<br />&amp;<br />Almh. Wina</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ---- event (3) ---- */}
        <div className={`${slideClass(3)} slide--ornament`} style={{ transform: slideTransform(3) }}>
          <span className="corner-bl" aria-hidden="true" />
          <section className="section section--paper" aria-labelledby="acara">
            <SideWave variant="event" />
            <div className="wrap">
              <span className="eyebrow slide-child" style={{ '--d': 0 }}>Save The Date</span>
              <h2 className="h2 slide-child" id="acara" style={{ '--d': 1 }}>Resepsi Pernikahan</h2>
              <Ornament d={2} />
              <div className="event slide-child" style={{ '--d': 3 }}>
                <p className="event-day">Sabtu</p>
                <p className="event-date">17</p>
                <p className="event-month">Oktober 2026</p>
                <hr className="rule-draw rule--tight" aria-hidden="true" />
                <p className="event-time">11:00 &ndash; 13:00 WIB</p>
                <hr className="rule-draw rule--tight" aria-hidden="true" />
                <p className="event-venue">Cornelis Koffie</p>
                <p className="event-addr">
                  Jl. Pemuda No.16, Depok, Kec. Pancoran Mas,<br />Kota Depok, Jawa Barat 16431
                </p>
                <a className="btn btn--ghost" href={MAPS_URL} target="_blank" rel="noreferrer">
                  <svg className="btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  View Location
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* ---- countdown (4) ---- */}
        {hasCountdown && (
          <div className={`${slideClass(4)} slide--ornament`} style={{ transform: slideTransform(4) }}>
            <span className="corner-bl" aria-hidden="true" />
            <section className="section" aria-labelledby="hitung-mundur">
              <SideWave variant="countdown" />
              <div className="wrap">
                <span className="eyebrow slide-child" style={{ '--d': 0 }}>Countdown</span>
                <h2 className="h2 slide-child" id="hitung-mundur" style={{ '--d': 1 }}>Menuju Hari Bahagia</h2>
                <Ornament d={2} />
                <div className="slide-child" style={{ '--d': 3 }}>
                  <MiniCalendar />
                </div>
                <div className="slide-child" style={{ '--d': 4 }}>
                  <div className="cd-frame">
                    <Countdown />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ---- gifts (5|4) ---- */}
        <div className={`${slideClass(hasCountdown ? 5 : 4)} slide--ornament`} style={{ transform: slideTransform(hasCountdown ? 5 : 4) }}>
          <SideWave variant="gifts" />
          <span className="corner-bl" aria-hidden="true" />
          <section className="section section--glow" aria-labelledby="tanda-kasih">
            <div className="wrap">
              <span className="eyebrow slide-child" style={{ '--d': 0 }}>Wedding Gift</span>
              <h2 className="h2 slide-child" id="tanda-kasih" style={{ '--d': 1 }}>Tanda Kasih</h2>
              <Ornament d={2} />
              <p className="gifts-note slide-child" style={{ '--d': 3 }}>
                Tanpa mengurangi rasa hormat, bagi tamu undangan yang ingin memberikan
                hadiah pernikahan kepada kedua mempelai, dapat dikirimkan melalui rekening
                di bawah ini :
              </p>
              <div className="accounts slide-child" style={{ '--d': 4 }}>
                {ACCOUNTS.map((account) => (
                  <div className="account" key={account.number}>
                    <span className="card-chip-pads" aria-hidden="true">
                      <span className="chip-pad" />
                      <span className="chip-pad" />
                      <span className="chip-pad" />
                      <span className="chip-pad" />
                      <span className="chip-pad" />
                      <span className="chip-pad" />
                    </span>
                    <div>
                      <p className="account-bank">{account.bank}</p>
                      <p className="account-num">{account.number}</p>
                      <p className="account-name">a.n. {account.holder}</p>
                    </div>
                    <CopyButton value={account.number} label={account.bank} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ---- footer (6|5) ---- */}
        <div className={`${slideClass(hasCountdown ? 6 : 5)} slide--ornament slide--footer`} style={{ transform: slideTransform(hasCountdown ? 6 : 5) }}>
          <SideWave variant="footer" />
          <span className="corner-bl" aria-hidden="true" />
          <footer className="footer">
            <p className="footer-names slide-child" style={{ '--d': 0 }}>Azzohabi &amp; Putri</p>
            <p className="footer-date slide-child" style={{ '--d': 1 }}>17 . 10 . 2026</p>
            <div className="slide-child" style={{ '--d': 2 }}>
              <div className="ornament" aria-hidden="true">
                <span className="ornament-line" />
                <svg className="ornament-heart" viewBox="0 0 12 11" width="10" height="9">
                  <path d="M6,10 C1.5,6.5 0,4 0,2.5 C0,1 1.2,0 2.5,0 C3.5,0 4.5,0.5 6,2 C7.5,0.5 8.5,0 9.5,0 C10.8,0 12,1 12,2.5 C12,4 10.5,6.5 6,10Z"
                    fill="currentColor" />
                </svg>
                <span className="ornament-line" />
              </div>
            </div>
            <p className="footer-thanks slide-child" style={{ '--d': 3 }}>
              Menjadi sebuah kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
              berkenan hadir dalam hari bahagia kami. Terima kasih atas segala ucapan,
              doa, dan perhatian yang diberikan.
            </p>
            <p className="footer-sub slide-child" style={{ '--d': 4 }}>See you on our big day!</p>
            <p className="footer-salam slide-child" style={{ '--d': 5 }}>
              Thank You
            </p>
            <p className="footer-credit slide-child" style={{ '--d': 6 }}>
              Made with love by <span>LokaWorks</span>
            </p>
          </footer>
        </div>

      </div>
    </>
  )
}
