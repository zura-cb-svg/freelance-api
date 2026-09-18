import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { formatBudget } from "../../utils/format";

const STATUS_TONE = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
};

export function ApplicationRow({ application, actions }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/jobs/${application.job_id}`}
            className="text-sm font-medium text-ink-900 hover:text-brand-700"
          >
            Job #{application.job_id}
          </Link>
          <Badge tone={STATUS_TONE[application.status] || "neutral"}>{application.status}</Badge>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-ink-500">{application.cover_letter}</p>
        <p className="mt-1 text-xs text-ink-500">
          Proposed {formatBudget(application.proposed_price)} · {application.estimated_days} day
          {application.estimated_days !== 1 ? "s" : ""}
        </p>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
