import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../assets/logo.png'
import goldCoin from '../assets/gold-coin-transparent.png'
import silverCoin from '../assets/silver-coin-transparent.png'
import CustomerNavbar from './CustomerNavbar'

const API_BASE = 'https://bitbyte-backend-f66f.onrender.com'

const getImageUrl = img => {
  if (!img) return null
  let p = typeof img === 'object' ? (img.image || img.url || '') : img
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  return `${API_BASE}/${p.replace(/^\/+/, '')}`
}

export default function CoinsCollection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const metalFilter = searchParams.get('metal') || 'silver'
  const gradeFilter = searchParams.get('grade')
  const weightFilter = searchParams.get('weight')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [metalPrices, setMetalPrices] = useState({ gold22k: null, gold24k: null, silver: null })
  const [hoveredId, setHoveredId] = useState(null)

  const isGold = metalFilter === 'gold'
  const coinImg = isGold ? goldCoin : silverCoin
  const accentColor = isGold ? '#fbbf24' : '#c0c0c0'
  const accentGrad = isGold ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#9ca3af,#e5e7eb)'

  useEffect(() => {
    fetch(`${API_BASE}/api/metal-rates/`)
      .then(r => r.json())
      .then(d => setMetalPrices({ gold22k: parseFloat(d.gold_22k), gold24k: parseFloat(d.gold_24k), silver: parseFloat(d.silver_999) }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    let url = `${API_BASE}/api/jewelry-products/?category=coins&metal=${metalFilter}`
    if (gradeFilter) url += `&grade=${gradeFilter}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        let list = Array.isArray(data) ? data : []
        // Weight filter — match by product name containing weight
        if (weightFilter) {
          list = list.filter(p => p.name?.toLowerCase().includes(weightFilter.toLowerCase()) || p.tag?.toLowerCase().includes(weightFilter.toLowerCase()))
        }
        setProducts(list)
        setLoading(false)
      })
      .catch(() => { setProducts([]); setLoading(false) })
  }, [metalFilter, gradeFilter, weightFilter])

  const getRate = (grade) => {
    if (!isGold) return metalPrices.silver
    if (grade === '24k') return metalPrices.gold24k
    return metalPrices.gold22k
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF5EE', fontFamily: '"Inter",system-ui,sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes goldShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .coin-card:hover { transform: translateY(-8px) scale(1.02) !important; }
      `}</style>

      {/* NAVBAR */}
  <CustomerNavbar />

      {/* HEADER BANNER */}
      <div style={{
        background: isGold
          ? 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)'
          : 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
        padding: '40px 40px 36px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background coin images */}
        {[...Array(6)].map((_, i) => (
          <img key={i} src={coinImg} alt="" style={{
            position: 'absolute',
            width: 80, height: 80, objectFit: 'contain', opacity: 0.06,
            left: `${10 + i * 16}%`, top: `${10 + (i % 2) * 40}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 2 }}>
          <img src={coinImg} alt="coin" style={{
            width: 100, height: 100, objectFit: 'contain',
            filter: `drop-shadow(0 8px 24px ${accentColor}88)`,
            animation: 'float 3s ease-in-out infinite',
            marginBottom: 16,
          }} />
          <div style={{
            fontSize: 36, fontWeight: 900, letterSpacing: -1,
            background: isGold
              ? 'linear-gradient(90deg,#f59e0b,#fbbf24,#ffd700,#fbbf24)'
              : 'linear-gradient(90deg,#9ca3af,#c0c0c0,#e2e8f0,#c0c0c0)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'goldShimmer 3s linear infinite',
            marginBottom: 8,
          }}>
            {isGold ? '🥇 Gold Coins' : '🥈 Silver Coins'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            {loading ? 'Loading...' : `${products.length} products`}
            {weightFilter && <span style={{ color: accentColor, fontWeight: 700, marginLeft: 8 }}>• {weightFilter}</span>}
          </div>

          {/* Live rates */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {!isGold && metalPrices.silver && (
              <div style={{ background: 'rgba(192,192,192,0.15)', border: '1px solid rgba(192,192,192,0.4)', borderRadius: 20, padding: '6px 18px', color: '#c0c0c0', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                🥈 Silver 999: ₹{metalPrices.silver.toFixed(2)}/gm
              </div>
            )}
            {isGold && metalPrices.gold22k && (
              <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 20, padding: '6px 18px', color: '#fbbf24', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                🏅 22K: ₹{metalPrices.gold22k.toFixed(2)}/gm
              </div>
            )}
            {isGold && metalPrices.gold24k && (
              <div style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 20, padding: '6px 18px', color: '#ffd700', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                🥇 24K: ₹{metalPrices.gold24k.toFixed(2)}/gm
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ddd5', padding: '14px 40px', display: 'flex', gap: 10, alignItems: 'center', overflowX: 'auto' }}>
        <span style={{ color: '#7c5c4a', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Metal:</span>
        {[
          { label: '🥈 Silver', metal: 'silver', grade: null },
          { label: '🏅 Gold 22K', metal: 'gold', grade: '22k' },
          { label: '🥇 Gold 24K', metal: 'gold', grade: '24k' },
        ].map(opt => {
          const isActive = metalFilter === opt.metal && (!opt.grade || gradeFilter === opt.grade)
          return (
            <button key={opt.label}
              onClick={() => {
                let url = `/collection/coins?metal=${opt.metal}`
                if (opt.grade) url += `&grade=${opt.grade}`
                if (weightFilter) url += `&weight=${weightFilter}`
                navigate(url)
              }}
              style={{
                padding: '8px 18px', borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
                background: isActive ? '#8B1A1A' : '#f5f0e8',
                color: isActive ? '#fff' : '#7c5c4a',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >{opt.label}</button>
          )
        })}

        {weightFilter && (
          <>
            <span style={{ color: '#e8ddd5' }}>|</span>
            <span style={{ background: '#fce8e8', color: '#8B1A1A', border: '1px solid #f3a0a0', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
              ⚖️ {weightFilter}
            </span>
            <button
              onClick={() => {
                let url = `/collection/coins?metal=${metalFilter}`
                if (gradeFilter) url += `&grade=${gradeFilter}`
                navigate(url)
              }}
              style={{ background: 'transparent', border: '1px solid #8B1A1A', color: '#8B1A1A', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >✕ Clear weight</button>
          </>
        )}
      </div>

      {/* PRODUCTS */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 40px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${accentColor}33`, borderTop: `3px solid ${accentColor}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ color: '#7c5c4a' }}>Loading coins...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <img src={coinImg} alt="" style={{ width: 80, height: 80, objectFit: 'contain', opacity: 0.3, marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a0a0a', marginBottom: 8 }}>No coins found</div>
            <div style={{ fontSize: 14, color: '#7c5c4a', marginBottom: 24 }}>
              {weightFilter ? `${weightFilter} weight coins not added yet` : 'No coins available yet'}
            </div>
            <button onClick={() => navigate('/customer')}
              style={{ padding: '12px 28px', background: '#8B1A1A', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
              ← Go Back
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, animation: 'fadeIn 0.4s ease' }}>
            {products.map(p => {
              const firstImg = p.images?.[0] ? getImageUrl(p.images[0]) : null
              const price = parseFloat(p.price) || 0
              const rate = getRate(p.grade)
              const netW = parseFloat(p.net_weight) || 0
              const livePrice = rate && netW ? (netW * rate * 1.03).toFixed(2) : null
              const isHovered = hoveredId === p.id

              return (
                <div key={p.id}
                  className="coin-card"
                  onClick={() => navigate(`/product-display?category=coins&metal=${metalFilter}&id=${p.id}`)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: '#fff',
                    border: isHovered ? `1px solid ${accentColor}` : '1px solid #e8ddd5',
                    borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: isHovered ? `0 16px 40px ${accentColor}33` : '0 2px 8px rgba(139,26,26,0.06)',
                  }}
                >
                  {/* Image */}
                  <div style={{
                    height: 200, position: 'relative', overflow: 'hidden',
                    background: isGold ? 'linear-gradient(135deg,#1a0a00,#3d1f00)' : 'linear-gradient(135deg,#0a0a1a,#1a1a2e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {firstImg
                      ? <img src={firstImg} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease', transform: isHovered ? 'scale(1.08)' : 'scale(1)' }} onError={e => e.currentTarget.style.display = 'none'} />
                      : <img src={coinImg} alt={p.name} style={{ width: 110, height: 110, objectFit: 'contain', filter: `drop-shadow(0 8px 20px ${accentColor}88)`, animation: isHovered ? 'float 1.5s ease-in-out infinite' : 'none' }} />
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />

                    {p.tag && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: '#8B1A1A', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 800 }}>
                        {p.tag}
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: `${accentColor}dd`, color: '#000', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 900 }}>
                      {p.grade?.toUpperCase() || (isGold ? '22K' : '999')}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1a0a0a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    {p.net_weight && (
                      <div style={{ fontSize: 12, color: '#7c5c4a', marginBottom: 8 }}>
                        ⚖️ {p.net_weight}g net weight
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: accentColor, fontFamily: 'monospace' }}>
                          {price > 0 ? `₹${price.toLocaleString('en-IN')}` : livePrice ? `₹${Number(livePrice).toLocaleString('en-IN')}` : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: '#b09080' }}>incl. 3% GST</div>
                      </div>
                      <div style={{
                        padding: '7px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                        background: isHovered ? accentGrad : '#f5f0e8',
                        color: isHovered ? '#000' : '#7c5c4a',
                        transition: 'all 0.2s',
                      }}>
                        {isHovered ? '→ View' : '🪙 Coin'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}