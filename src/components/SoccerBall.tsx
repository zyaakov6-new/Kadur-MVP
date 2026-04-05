export default function SoccerBall({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="currentColor" opacity="0.9" />
      <circle cx="50" cy="50" r="48" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      {/* Pentagon center */}
      <polygon points="50,28 63,38 58,53 42,53 37,38" fill="rgba(0,0,0,0.75)" />
      {/* Surrounding pentagons */}
      <polygon points="50,10 58,17 55,28 45,28 42,17" fill="rgba(0,0,0,0.65)" />
      <polygon points="72,24 78,33 72,42 63,38 63,28" fill="rgba(0,0,0,0.65)" />
      <polygon points="78,52 76,63 66,65 63,53 70,45" fill="rgba(0,0,0,0.65)" />
      <polygon points="58,78 50,82 42,78 44,67 56,67" fill="rgba(0,0,0,0.65)" />
      <polygon points="28,52 30,45 37,53 34,65 24,63" fill="rgba(0,0,0,0.65)" />
      <polygon points="22,24 37,28 37,38 28,42 22,33" fill="rgba(0,0,0,0.65)" />
    </svg>
  )
}
