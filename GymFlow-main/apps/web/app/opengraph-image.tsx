import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GymFlow — Plataforma para Academias'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06060F',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 6.5h11" />
            <path d="M6.5 17.5h11" />
            <path d="M3 9.5h2v5H3z" />
            <path d="M19 9.5h2v5h-2z" />
            <path d="M1 11.5h2" />
            <path d="M21 11.5h2" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-2px',
            color: 'white',
            marginBottom: 16,
          }}
        >
          Gym<span style={{ color: '#818cf8' }}>Flow</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Plataforma SaaS para academias
        </div>

        {/* Bottom pill */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 999,
            padding: '10px 24px',
            color: '#a5b4fc',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          gymflow.app
        </div>
      </div>
    ),
    { ...size }
  )
}
