export default function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#6B1E2E" strokeWidth="2.4" />
      <path d="M20 6 C20 6 26 14 26 21 C26 27.5 20 34 20 34 C20 34 14 27.5 14 21 C14 14 20 6 20 6 Z" fill="#6B1E2E" />
      <circle cx="20" cy="19.5" r="3.2" fill="#F7EDE7" />
      <path d="M6 20 H34 M20 6 V34" stroke="#6B1E2E" strokeWidth="1" opacity="0.25" />
    </svg>
  )
}
