import { type ReactNode, useId } from "react";
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

export function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <span className={`eyebrow ${light ? "light" : ""}`}>
      <span />
      {children}
    </span>
  );
}

export function PathGraphic({
  value = 2,
  target = 5,
  compact = false,
  tone = "green",
}: {
  value?: number;
  target?: number;
  compact?: boolean;
  tone?: string;
}) {
  const gradientId = useId();
  const fraction = Math.min(1, Math.max(0, value / target));
  return (
    <div className={`path-graphic ${compact ? "compact" : ""} tone-${tone}`}>
      <svg
        viewBox="0 0 640 235"
        role="img"
        aria-label={`${value} of ${target} recorded. Future milestones are shown as outlined markers.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".10" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="path-terrain"
          d="M25 182C112 182 124 134 206 134S284 165 352 113S480 74 510 58S570 43 611 35L611 213H25Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M25 182C112 182 124 134 206 134S284 165 352 113S480 74 510 58S570 43 611 35"
          className="path-future"
          pathLength="100"
        />
        <path
          d="M25 182C112 182 124 134 206 134S284 165 352 113S480 74 510 58S570 43 611 35"
          className="path-recorded"
          pathLength="100"
          strokeDasharray={`${fraction * 100} 100`}
        />
        {[
          [25, 182, 0],
          [206, 134, 0.3],
          [352, 113, 0.55],
          [510, 58, 0.8],
          [611, 35, 1],
        ].map(([x, y, at], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={at <= fraction ? 6 : 5}
              className={at <= fraction ? "node-recorded" : "node-future"}
            />
            {!compact && (
              <text
                x={x}
                y={y + 29}
                textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
              >
                {i === 0 ? "START" : i === 4 ? "YOUR GOAL" : `MILESTONE ${i}`}
              </text>
            )}
          </g>
        ))}
        <path d="m603 13 8-8 8 8-8 8z" fill="currentColor" />
      </svg>
    </div>
  );
}
