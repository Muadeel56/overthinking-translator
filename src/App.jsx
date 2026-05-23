import { useState, useRef, useEffect } from 'react'
import './App.css'

const SEED_THOUGHTS = [
  "they didn't text back",
  "i should've said something",
  "what if i picked wrong",
  "everyone seems fine but me",
]

const FALLBACK = {
  fear: "you're afraid the silence means something it doesn't — that being unseen for a moment proves you're forgettable.",
  label: "Abandonment",
  intensity: "soft",
  bodyHint: "tight chest, scrolling",
  reframe: "their pause is not your verdict. people get pulled under by their own days. you can let the quiet exist without filling it with a story about your worth.",
}

const SYSTEM_PROMPT = `You are a tender, perceptive translator of overthinking. The user shares an anxious or looping thought. You respond with ONLY a JSON object — no preamble, no markdown fences — in this exact shape:

{
  "fear": "1-2 sentences. The deeper fear underneath the thought. Begin with 'you're afraid...' or 'underneath this is...' Lowercase, gentle, second-person, specific to their words.",
  "label": "ONE word naming the emotional pattern. Title Case. Examples: Avoidance, Abandonment, Rejection, Perfectionism, Control, Shame, Worthiness, Comparison, Overresponsibility, Anticipatory Grief. Pick the most accurate one.",
  "intensity": "soft | medium | sharp — how acute this feels",
  "bodyHint": "3-5 words describing where this likely lives in the body, lowercase. e.g. 'tight jaw, shallow breath'",
  "reframe": "2-3 sentences. A warm, therapy-coded counter-thought. Not toxic positivity. Acknowledge the feeling, then offer a softer truth. Lowercase, second-person, poetic but plain. Do not start with 'remember' or 'just'."
}

Tone: lo-fi, late-night, deeply human. Therapist + best friend. Never clinical, never saccharine. Never use exclamation points. Never apologize. Never refuse — even short or vague thoughts deserve a gentle read.`

const GEMINI_KEY = '***REMOVED***'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

async function translateThought(thought) {
  const userMsg = `here's what's in my head:\n\n"${thought.trim()}"\n\ntranslate it.`
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n---\n\n' + userMsg }] }],
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const json = await res.json()
  let txt = (json.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
  txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const first = txt.indexOf('{')
  const last = txt.lastIndexOf('}')
  if (first === -1 || last === -1) throw new Error('no JSON in response')
  const obj = JSON.parse(txt.slice(first, last + 1))
  if (!obj.fear || !obj.label || !obj.reframe) throw new Error('missing fields')
  return obj
}

/* ── Moon ── */
function Moon() {
  return <div className="moon" aria-hidden="true" />
}

/* ── Composer ── */
function Composer({ value, onChange, onSubmit, loading }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.max(160, ref.current.scrollHeight) + 'px'
    }
  }, [value])

  const count = value.trim().length
  const canSend = count > 2 && !loading

  return (
    <div className="composer">
      <textarea
        ref={ref}
        className="w-full bg-transparent border-none outline-none resize-none"
        style={{
          minHeight: 160,
          padding: '24px 24px 16px',
          color: '#e9e6f5',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(18px, 2.2vw, 22px)',
          fontWeight: 400,
          lineHeight: 1.6,
          letterSpacing: '.008em',
        }}
        placeholder="what's actually on your mind right now..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
            e.preventDefault()
            onSubmit()
          }
        }}
        spellCheck={false}
      />

      <div
        className="flex items-center justify-between flex-wrap gap-3 px-5 pb-4 pt-3"
        style={{
          borderTop: '1px solid rgba(167,139,250,.10)',
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.20))',
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.08em' }}
        >
          <span style={{ color: count > 2 ? '#a78bfa' : '#5e5972', transition: 'color .2s' }}>{count}</span>
          <span style={{ color: '#5e5972' }}>chars</span>
          <span style={{ color: '#3d3852', margin: '0 2px' }}>·</span>
          <span style={{ color: '#5e5972' }}>⌘↵ to translate</span>
        </div>

        <button className="translate-btn" onClick={onSubmit} disabled={!canSend}>
          <span
            className="dot-pulse"
            style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: canSend ? '#a78bfa' : '#5e5972',
              boxShadow: canSend ? '0 0 12px #a78bfa, 0 0 24px rgba(167,139,250,.5)' : 'none',
              display: 'inline-block',
              transition: 'background .3s, box-shadow .3s',
            }}
          />
          {loading ? 'translating…' : 'Translate My Thoughts'}
        </button>
      </div>
    </div>
  )
}

/* ── Seeds ── */
function Seeds({ onPick }) {
  return (
    <div className="flex gap-2 flex-wrap justify-center mt-6">
      {SEED_THOUGHTS.map(s => (
        <button key={s} className="seed-pill" onClick={() => onPick(s)}>
          {s}
        </button>
      ))}
    </div>
  )
}

/* ── Loading ── */
function LoadingState() {
  return (
    <div className="flex flex-col gap-4 mt-10">
      <p
        className="text-center italic ellip"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: '#a39fb8', fontSize: 18, opacity: .9,
          letterSpacing: '.02em',
        }}
      >
        listening
      </p>
      {[140, 110, 125].map((h, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            borderRadius: 18,
            border: '1px solid rgba(167,139,250,.10)',
            background: 'linear-gradient(160deg, rgba(20,17,35,.65), rgba(12,10,22,.65))',
            height: h,
          }}
        />
      ))}
    </div>
  )
}

/* ── Card ── */
function Card({ kicker, title, icon, children, delay = 1, variant = '' }) {
  return (
    <div className={`card animate-rise delay-${delay} ${variant}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="icon-circle">{icon}</div>
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '.26em', color: '#a78bfa', opacity: .9,
            }}
          >
            {kicker}
          </div>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(18px, 2.2vw, 22px)',
              lineHeight: 1.2, color: '#e9e6f5',
              margin: '3px 0 0', fontWeight: 400,
            }}
          >
            {title}
          </h3>
        </div>
      </div>
      <div style={{ color: '#b8b4cc', fontSize: 15, lineHeight: 1.7, fontWeight: 300 }}>
        {children}
      </div>
    </div>
  )
}

/* ── Output ── */
function Output({ data }) {
  if (!data) return null

  const intensityClass =
    data.intensity === 'sharp' ? 'badge-sharp' :
    data.intensity === 'medium' ? 'badge-medium' : 'badge-soft'

  return (
    <div key={data._k} className="flex flex-col gap-4 mt-10">

      <Card kicker="The Real Fear" title="what you're actually afraid of" icon="🧠" delay={1} variant="card-fear">
        <p style={{ margin: 0 }}>{data.fear}</p>
      </Card>

      <Card kicker="Emotional Label" title="name it to soften it" icon="🫧" delay={2} variant="card-label">
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(36px, 5vw, 50px)',
            letterSpacing: '-.01em', lineHeight: 1,
            margin: '4px 0 12px',
            background: 'linear-gradient(160deg, #f5f0ff 0%, #c4b5fd 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          {data.label}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge ${intensityClass}`}>
            {data.intensity || 'medium'}
          </span>
          {data.bodyHint && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5, color: '#5e5972',
                letterSpacing: '.12em', textTransform: 'uppercase',
              }}
            >
              · {data.bodyHint}
            </span>
          )}
        </div>
      </Card>

      <Card kicker="Gentle Reframe" title="a softer thought to hold" icon="🌱" delay={3} variant="card-reframe">
        <p style={{ margin: 0 }}>{data.reframe}</p>
      </Card>

    </div>
  )
}

/* ── App ── */
export default function App() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  const submit = async () => {
    if (!text.trim()) return
    setLoading(true)
    setErr(null)
    try {
      const obj = await translateThought(text)
      obj._k = Date.now()
      setData(obj)
    } catch (e) {
      console.warn(e)
      setData({ ...FALLBACK, _k: Date.now() })
      setErr('the line was a little hazy — showing a gentle read.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative mx-auto pb-20"
      style={{
        maxWidth: 660,
        padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 32px) 80px',
        zIndex: 2,
      }}
    >
      <Moon />

      {/* eyebrow */}
      <p
        className="text-center"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5, letterSpacing: '.32em',
          textTransform: 'uppercase', color: '#4a455e',
          margin: '0 0 20px',
        }}
      >
        overthinking translator
      </p>

      {/* headline */}
      <h1
        className="text-center"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: 'clamp(30px, 5.5vw, 46px)',
          letterSpacing: '-.01em', lineHeight: 1.2,
          color: '#e9e6f5',
          margin: '0 auto 10px',
          maxWidth: 500,
        }}
      >
        you're not crazy.<br />
        you're just{' '}
        <em
          style={{
            fontStyle: 'italic', fontWeight: 300,
            background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 60%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          overthinking
        </em>
        .
      </h1>

      {/* sub */}
      <p
        className="text-center"
        style={{
          color: '#7a768e', fontSize: 'clamp(13px, 1.8vw, 15px)',
          fontWeight: 300, margin: '0 0 40px',
          letterSpacing: '.01em',
        }}
      >
        a quiet place to translate the loop into something you can hold.
      </p>

      <Composer value={text} onChange={setText} onSubmit={submit} loading={loading} />

      {!data && !loading && <Seeds onPick={s => setText(s)} />}
      {loading && <LoadingState />}
      {!loading && data && <Output data={data} />}

      {err && (
        <div
          className="mt-6 px-5 py-4"
          style={{
            border: '1px solid rgba(244,114,182,.25)',
            borderRadius: 14,
            background: 'rgba(40,18,30,.50)',
            color: '#f9a8d4',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, letterSpacing: '.04em,',
            lineHeight: 1.6,
          }}
        >
          ⚠ {err}
        </div>
      )}

      {/* footer */}
      <footer className="mt-24 text-center">
        <div className="divider mb-6" />
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(15px, 2vw, 17px)',
            color: '#7a768e', letterSpacing: '.02em', margin: 0,
          }}
        >
          3am thoughts deserve honest answers.
        </p>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5, letterSpacing: '.30em',
            textTransform: 'uppercase', color: '#3d3852',
            margin: '12px 0 0',
          }}
        >
          — breathe · ⌘↵ —
        </p>
      </footer>
    </main>
  )
}
