interface StatusIconProps {
  ok: boolean
}

/** Circular pass/fail badge shown next to a condition check — clearer at a glance than a KaTeX glyph. */
function StatusIcon({ ok }: StatusIconProps) {
  return ok ? (
    <svg
      className="inline-block h-5 w-5 shrink-0 align-middle"
      viewBox="0 0 20 20"
      role="img"
      aria-label="Spełniono"
    >
      <title>Spełniono</title>
      <circle cx="10" cy="10" r="9" fill="#16a34a" />
      <path
        d="M6 10.3l2.6 2.6L14.2 7"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      className="inline-block h-5 w-5 shrink-0 align-middle"
      viewBox="0 0 20 20"
      role="img"
      aria-label="Niespełniono"
    >
      <title>Niespełniono</title>
      <circle cx="10" cy="10" r="9" fill="#dc2626" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default StatusIcon
