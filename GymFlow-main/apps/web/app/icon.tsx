import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #818cf8, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
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
    ),
    { ...size }
  )
}
