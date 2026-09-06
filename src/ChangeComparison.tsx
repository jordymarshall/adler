import type { ReactNode } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";

export function ChangeComparison({
  before,
  after,
}: {
  before: ReactNode;
  after: ReactNode;
}) {
  return (
    <div className="change-comparison">
      <div className="change-side change-before">
        <span className="comparison-label">Before</span>
        <div className="comparison-value">{before}</div>
      </div>
      <ArrowRight className="change-direction" size={17} aria-hidden="true" />
      <div className="change-side change-after">
        <span className="comparison-label">After</span>
        <div className="comparison-value">{after}</div>
      </div>
    </div>
  );
}

export function ChangeReason({ children }: { children: ReactNode }) {
  return (
    <div className="change-reason">
      <Lightbulb size={15} aria-hidden="true" />
      <div>
        <span className="comparison-label">Why this change</span>
        <p>{children}</p>
      </div>
    </div>
  );
}
