import { Star } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";

function StarRow({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "fill-brand-500 text-brand-500" : "text-line"}
        />
      ))}
    </div>
  );
}

export function ReviewsPanel({ reviews, status, onRetry }) {
  if (status === "loading") {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-line/50" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't load reviews"
        description="Something went wrong while fetching reviews."
        action={
          onRetry && (
            <button onClick={onRetry} className="btn-secondary px-4 py-2 text-sm">
              Retry
            </button>
          )
        }
      />
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState title="No reviews yet" description="Completed work will earn reviews that show up here." />
    );
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl font-semibold text-ink-900">{average.toFixed(1)}</span>
        <div>
          <StarRow value={average} size={16} />
          <p className="text-xs text-ink-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <StarRow value={review.rating} />
              <span className="text-xs text-ink-500">Reviewer #{review.reviewer_id}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
