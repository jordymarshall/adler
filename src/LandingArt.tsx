import { Link } from "react-router-dom";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`adler-mark ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 4v32M6.14 12l27.72 16M6.14 28l27.72-16"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="Adler home">
      <Mark />
      <span>
        adler<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
