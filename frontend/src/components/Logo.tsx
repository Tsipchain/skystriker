/**
 * SkyStriker brand logo – inline SVG for crisp rendering at any size.
 * Location pin + verification checkmark = verified local guides.
 */
export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      aria-label="SkyStriker logo"
    >
      <defs>
        <linearGradient id="ss-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="ss-pin" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#ss-bg)" />
      <path
        d="M256 72c-74.4 0-134.7 60.3-134.7 134.7C121.3 290 256 420 256 420s134.7-130 134.7-213.3C390.7 132.3 330.4 72 256 72z"
        fill="url(#ss-pin)"
        opacity="0.95"
      />
      <circle cx="256" cy="206" r="58" fill="#0369a1" />
      <path
        d="M232 206 l16 18 l32-36"
        fill="none"
        stroke="#fff"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M256 52 l8 28 l-16 0z" fill="#fff" opacity="0.6" />
      <path d="M256 360 l8-28 l-16 0z" fill="#fff" opacity="0.4" />
      <path d="M136 206 l28 8 l0-16z" fill="#fff" opacity="0.5" />
      <path d="M376 206 l-28 8 l0-16z" fill="#fff" opacity="0.5" />
    </svg>
  )
}
