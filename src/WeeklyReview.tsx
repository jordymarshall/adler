import { Link, Navigate } from "react-router-dom";
export function WeeklyReview({ embedded = false }: { embedded?: boolean }) {
  const href =
    "/app/coach?intent=review&prompt=" +
    encodeURIComponent(
      "Let’s review how things went across my goals. Help me reflect on what happened, what got in the way, and what to adjust.",
    );
  return embedded ? (
    <section className="review-invitation">
      <h2>Time to reflect</h2>
      <p>
        Bring your week to the same conversation. Adler has your goals and
        previous check-ins.
      </p>
      <Link className="text-link" to={href}>
        Continue in Coach →
      </Link>
    </section>
  ) : (
    <Navigate to={href} replace />
  );
}
