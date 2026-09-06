export function AdlerAvatar({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`adler-avatar ${small ? "small" : ""}`}
      role="img"
      aria-label="Adler"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M16 6v20M6 16h20M9 9l14 14M9 23 23 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
