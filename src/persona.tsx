export function AdlerAvatar({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`adler-avatar ${small ? "small" : ""}`}
      role="img"
      aria-label="Adler"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M11 24C11 14 18 9 24 9s13 5 13 15c0 9-5 15-13 15S11 33 11 24Z"
          fill="currentColor"
        />
        <path
          d="M17 22v3m14-3v3m-12 6c3 3 7 3 10 0"
          fill="none"
          stroke="var(--avatar-ink, #f9faed)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="m25 8 4-4m-6 4-2-4"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
