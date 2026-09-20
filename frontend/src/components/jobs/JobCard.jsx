import { Link } from "react-router-dom";
import { ArrowRight, Wallet } from "lucide-react";
import { formatBudget, truncate } from "../../utils/format";

export function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      state={{ job }}
      className="card group flex flex-col gap-3.5 p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
          {job.title}
        </h3>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          <Wallet size={12} />
          {formatBudget(job.budget)}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-ink-500">{truncate(job.description, 150)}</p>

      <div className="mt-1 flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-xs text-ink-500">
          Posted by {job.owner?.full_name || `Client #${job.owner_id}`}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:gap-1.5">
          View job <ArrowRight size={14} className="transition-all" />
        </span>
      </div>
    </Link>
  );
}
