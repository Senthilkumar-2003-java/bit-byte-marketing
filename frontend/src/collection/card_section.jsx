import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i, size: Math.random() * 50 + 8, x: Math.random() * 100,
  delay: Math.random() * 8, duration: Math.random() * 12 + 15, opacity: Math.random() * 0.18 + 0.04,
}))

// ── Cart Storage Helpers ──
export function getCart() {
  try { return JSON.parse(localStorage.getItem('bb_cart') || '[]') } catch { return [] }
}
export function saveCart(items) {
  localStorage.setItem('bb_cart', JSON.stringify(items))
  window.dispatchEvent(new Event('bb_cart_update'))
}
export function addToCart(item) {
  const cart = getCart()
  // item: { id, name, desc, img, tag, metal, metalLabel, ringType }
  const exists = cart.find(c => c.id === item.id && c.metal === item.metal && c.ringType === item.ringType)
  if (exists) {
    exists.qty = (exists.qty || 1) + 1
  } else {
    cart.push({ ...item, qty: 1, addedAt: Date.now() })
  }
  saveCart(cart)
}
export function getCartCount() {
  return getCart().reduce((acc, i) => acc + (i.qty || 1), 0)
}

export default function CardSection() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(true)
  const [cart, setCart] = useState([])
  const canvasRef = useRef(null)

  const bg       = dark ? '#020617' : '#f8fafc'
  const text     = dark ? '#f8fafc' : '#020617'
  const subtext  = dark ? '#94a3b8' : '#64748b'
  const border   = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const glass    = dark ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.7)'
  const cardBg   = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const cardBorder = dark ? '1px solid rgba(103,232,249,0.1)' : '1px solid rgba(0,0,0,0.1)'

  useEffect(() => {
    setCart(getCart())
    const handler = () => setCart(getCart())
    window.addEventListener('bb_cart_update', handler)
    return () => window.removeEventListener('bb_cart_update', handler)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId, particles = []
    const mouse = { x: null, y: null, radius: 150 }
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const mouseMove = (e) => { mouse.x = e.x; mouse.y = e.y }
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', mouseMove)
    resize()

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 4 + 2
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
      }
      update() {
        this.x += this.speedX; this.y += this.speedY
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1
        if (mouse.x !== null) {
          const dx = mouse.x - this.x, dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const f = (mouse.radius - dist) / mouse.radius
            this.x += (dx / dist) * f * 2; this.y += (dy / dist) * f * 2
          }
        }
      }
      draw() {
        ctx.fillStyle = dark ? 'rgba(34,211,238,0.9)' : 'rgba(37,99,235,0.8)'
        ctx.save(); ctx.translate(this.x, this.y); ctx.beginPath()
        const spikes = 5, outerR = this.size, innerR = this.size * 0.4
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR
          const a = (i * Math.PI) / spikes - Math.PI / 2
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        }
        ctx.closePath(); ctx.fill(); ctx.restore()
      }
    }

    function init() { particles = []; for (let i = 0; i < 60; i++) particles.push(new Particle()) }
    function connect() {
      for (let a = 0; a < particles.length; a++) for (let b = a; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x, dy = particles[a].y - particles[b].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 150) {
          ctx.strokeStyle = dark ? `rgba(34,211,238,${1 - d / 150})` : `rgba(37,99,235,${0.5 - d / 300})`
          ctx.lineWidth = 0.5; ctx.beginPath()
          ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke()
        }
      }
    }
    function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw() }); connect(); animId = requestAnimationFrame(animate) }
    init(); animate()
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('mousemove', mouseMove); cancelAnimationFrame(animId) }
  }, [dark])

  const removeItem = (idx) => {
    const updated = cart.filter((_, i) => i !== idx)
    saveCart(updated)
    setCart(updated)
  }

  const updateQty = (idx, delta) => {
    const updated = cart.map((item, i) => {
      if (i !== idx) return item
      const newQty = (item.qty || 1) + delta
      return newQty < 1 ? null : { ...item, qty: newQty }
    }).filter(Boolean)
    saveCart(updated)
    setCart(updated)
  }

  const clearCart = () => {
    saveCart([])
    setCart([])
  }

  const metalColor = (metal) => {
    if (!metal) return '#fbbf24'
    if (metal.includes('22k') || metal.includes('22K')) return '#fbbf24'
    if (metal.includes('24k') || metal.includes('24K')) return '#ffd700'
    if (metal.includes('silver') || metal.includes('Silver')) return '#c0c0c0'
    return '#fbbf24'
  }

  const metalLabel = (item) => item.metalLabel || item.metal || ''

  const totalItems = cart.reduce((acc, i) => acc + (i.qty || 1), 0)

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: '"Inter",system-ui,sans-serif', position: 'relative', overflow: 'hidden', transition: 'background 0.8s ease, color 0.4s ease' }}>
      <style>{`
        @keyframes float-orb { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes antigravity { 0%{transform:translateY(110vh) rotate(0deg);opacity:0} 10%{opacity:var(--op)} 90%{opacity:var(--op)} 100%{transform:translateY(-20vh) rotate(360deg);opacity:0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
        .cart-card { animation: fadeInUp 0.4s ease both; transition: all 0.3s ease; }
        .cart-card:hover { transform: translateY(-3px); }
        .sparkle-dot { animation: sparkle 2s ease infinite; }
        .remove-btn:hover { background: rgba(239,68,68,0.25) !important; }
        .qty-btn:hover { background: rgba(34,211,238,0.2) !important; }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.4 }} />

      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', animation: 'float-orb 20s infinite ease-in-out', zIndex: 0, top: '8%', left: '8%', width: '380px', height: '380px', background: dark ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.08)' }} />
      <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', animation: 'float-orb 20s infinite ease-in-out', zIndex: 0, bottom: '10%', right: '4%', width: '460px', height: '460px', background: dark ? 'rgba(110,231,183,0.06)' : 'rgba(52,211,153,0.06)', animationDelay: '-5s' }} />

      {PARTICLES.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, bottom: '-100px', width: p.size, height: p.size, borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%', border: `1px solid rgba(34,211,238,0.44)`, opacity: p.opacity, animation: `antigravity ${p.duration}s ${p.delay}s infinite linear`, '--op': p.opacity, pointerEvents: 'none', zIndex: 0 }} />
      ))}

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10, background: glass, borderBottom: `1px solid ${border}`, padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="BitByte Logo" style={{ width: 60, height: 50, borderRadius: '10px', objectFit: 'contain' }} />
          <span style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '14px' }}>🛒 My Cart</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/customer')} style={{ padding: '8px 18px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
            ← Dashboard
          </button>
          <button onClick={() => setDark(!dark)} style={{ padding: '8px 16px', borderRadius: '16px', border: `1px solid ${border}`, background: 'transparent', color: text, cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ position: 'relative', zIndex: 10, padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>


<div style={{ animation: 'fadeInUp 0.4s ease both', marginBottom: '32px' }}>
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '30px', padding: '5px 16px', marginBottom: '12px' }}>
    <span className="sparkle-dot" style={{ color: '#34d399', fontSize: '11px' }}>✦</span>
    <span style={{ color: '#34d399', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Cart</span>
  </div>

  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
    <div>
      <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px' }}>
        🛒 <span style={{ background: 'linear-gradient(90deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Cart</span>
      </h1>
      <p style={{ color: subtext, fontSize: '13px', margin: '6px 0 0' }}>
        {totalItems} item{totalItems !== 1 ? 's' : ''} saved
      </p>

      {/* ── TOTAL PRICE ── */}
      {cart.length > 0 && (() => {
        const totalPrice = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.qty || 1), 0)
        return totalPrice > 0 ? (
          <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '14px', padding: '8px 16px' }}>
            <span style={{ color: subtext, fontSize: '11px', fontWeight: 600 }}>Total Value</span>
            <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '18px', fontFamily: 'monospace' }}>
              ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : null
      })()}

      {/* ── CLEAR ALL — left side ── */}
      {cart.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={clearCart}
            style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            🗑 Clear All
          </button>
        </div>
      )}
    </div>
  </div>
</div>

        {/* Empty State */}
        {cart.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeInUp 0.5s ease both' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <div style={{ color: text, fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Your cart is empty</div>
            <div style={{ color: subtext, fontSize: '14px', marginBottom: '28px' }}>Browse our collections and add items you love</div>
            <button
              onClick={() => navigate('/customer')}
              style={{ padding: '12px 32px', background: 'linear-gradient(90deg,#34d399,#22d3ee)', border: 'none', borderRadius: '14px', color: '#003b40', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}
            >
              💍 Explore Collections
            </button>
          </div>
        )}

        {/* Cart Items */}
        {cart.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {cart.map((item, idx) => {
              const col = metalColor(item.metal)
              const delay = idx * 0.07
              return (
                <div
                  key={`${item.id}-${item.metal}-${item.ringType}-${idx}`}
                  className="cart-card"
                  style={{
                    animationDelay: `${delay}s`,
                    background: cardBg,
                    border: `1px solid rgba(${col === '#fbbf24' ? '251,191,36' : col === '#ffd700' ? '255,215,0' : '192,192,192'},0.2)`,
                    borderRadius: '20px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  {/* Image */}
                  <div style={{ width: '90px', height: '90px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, border: `1px solid rgba(${col === '#fbbf24' ? '251,191,36' : col === '#ffd700' ? '255,215,0' : '192,192,192'},0.3)` }}>
                    <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ color: col, fontWeight: 800, fontSize: '15px' }}>{item.name}</span>
                      {item.tag && (
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: `rgba(${col === '#fbbf24' ? '251,191,36' : col === '#ffd700' ? '255,215,0' : '192,192,192'},0.15)`, color: col, border: `1px solid ${col}55` }}>
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <div style={{ color: subtext, fontSize: '11px', marginBottom: '6px', lineHeight: '1.5' }}>{item.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
  {metalLabel(item) && (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `rgba(${col === '#fbbf24' ? '251,191,36' : col === '#ffd700' ? '255,215,0' : '192,192,192'},0.1)`, color: col, border: `1px solid ${col}44` }}>
      {metalLabel(item)}
    </span>
  )}

  {item.ringType && (
    <span style={{ fontSize: '10px', color: subtext, fontWeight: 600 }}>
      {item.ringType}
    </span>
  )}

  {item.price > 0 && (
    <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
      ₹{Number(item.price).toFixed(2)}
    </span>
  )}
</div>
                  </div>

                  {/* Qty Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(idx, -1)}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, transition: 'background 0.2s' }}
                    >−</button>
                    <span style={{ color: text, fontWeight: 800, fontSize: '15px', minWidth: '24px', textAlign: 'center' }}>{item.qty || 1}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(idx, 1)}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, transition: 'background 0.2s' }}
                    >+</button>
                  </div>

                  {/* Remove */}
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(idx)}
                    style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
                    title="Remove"
                  >✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Bar */}
        {cart.length > 0 && (
          <div style={{ marginTop: '28px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '20px', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            <div>
              <div style={{ color: subtext, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Items</div>
              <div style={{ color: '#34d399', fontWeight: 900, fontSize: '22px' }}>{totalItems}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate('/customer')}
                style={{ padding: '12px 24px', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                + Add More
              </button>
              <button
                onClick={() => navigate('/customer')}
                style={{ padding: '12px 28px', background: 'linear-gradient(90deg,#34d399,#22d3ee)', border: 'none', borderRadius: '12px', color: '#003b40', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}
              >
                🛒 Place Order on Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '48px', animation: 'fadeInUp 0.6s ease 0.3s both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', color: subtext, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            <div style={{ width: '40px', height: '1px', background: `linear-gradient(90deg,transparent,${subtext})` }} />
            BitByte Jewellers • My Cart
            <div style={{ width: '40px', height: '1px', background: `linear-gradient(90deg,${subtext},transparent)` }} />
          </div>
        </div>
      </div>
    </div>
  )
}