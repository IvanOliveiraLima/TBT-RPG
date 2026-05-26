interface IconProps { size?: number | undefined; color?: string | undefined }

export function BowIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Bow arc */}
      <path d="M5 21C5 12 12 5 21 3" />
      {/* Arrow shaft */}
      <line x1="4" y1="4" x2="16" y2="16" />
      {/* Arrowhead */}
      <polyline points="11 4 16 4 16 9" />
    </svg>
  )
}
