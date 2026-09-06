import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Asterisk,
  BookOpen,
  Check,
  FileText,
  Folder,
  X,
} from "lucide-react";
import { type GoalKind } from "./store";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="Adler home"
    >
      <Asterisk strokeWidth={2.2} aria-hidden="true" />
      <span>
        adler<span className="logo-period">.</span>
      </span>
    </Link>
  );
}
export function GoalIcon({
  kind,
  small = false,
}: {
  kind: GoalKind;
  small?: boolean;
}) {
  const Icon =
    kind === "project" ? FileText : kind === "learning" ? BookOpen : Folder;
  return (
    <span className={`goal-icon ${kind} ${small ? "small" : ""}`}>
      <Icon size={small ? 16 : 22} strokeWidth={1.7} />
    </span>
  );
}
export function Tag({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const dialog = ref.current!;
    dialog.showModal();
    document.body.classList.add("modal-open");
    return () => {
      dialog.close();
      document.body.classList.remove("modal-open");
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Asterisk size={35} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Sprout({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 190"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M91 169c-6-42-7-75 5-122"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M94 82C64 79 46 57 49 28c30 1 50 22 45 54Z"
        fill="currentColor"
        opacity=".18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M92 109c33 0 57-19 60-49-33-3-56 15-60 49Z"
        fill="currentColor"
        opacity=".26"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M87 137c-29-1-48-16-53-43 28-4 51 14 53 43Z"
        fill="currentColor"
        opacity=".14"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m63 42 26 32m47 2-36 27m-51 4 35 25M59 171c18-6 38-6 62-1"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Logo />
      <p>Plan the work. Track the result.</p>
      <nav aria-label="Footer">
        <Link to="/method">The method</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/support">
          Support <ArrowUpRight size={13} />
        </Link>
      </nav>
      <span className="copyright">© {new Date().getFullYear()} Adler</span>
    </footer>
  );
}
export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <span className="check-line">
      <Check size={15} />
      {children}
    </span>
  );
}
