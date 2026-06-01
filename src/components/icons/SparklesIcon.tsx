interface IconProps { size?: number | undefined; color?: string | undefined }

export function SparklesIcon({ size = 16, color = 'currentColor' }: IconProps) {
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
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
      <path d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25L19 3Z" />
      <path d="M5 17L5.5 18.75L7 19.5L5.5 20.25L5 22L4.5 20.25L3 19.5L4.5 18.75L5 17Z" />
    </svg>
  )
}
