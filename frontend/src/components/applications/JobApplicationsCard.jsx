import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { getApplicationsForJob, updateApplicationStatus } from "../../api/applications";
import { useToast } from "../../context/ToastContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatBudget } from "../../utils/format";

const STATUS_TONE = { pending: "pending", accepted: "accepted", rejected: "rejected" };

export function JobApplicationsCard({ job }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [updatingId, setUpdatingId] = useState(null);

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && applications === null) {
      setStatus("loading");
      try {
        const data = await getApplicationsForJob(job.id);
        setApplications(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    try {
      const updated = await updateApplicationStatus(applicationId, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? updated : a)));
      toast.success(`Application ${newStatus}.`);
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't update this application.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <Link
            to={`/jobs/${job.id}`}
            state={{ job }}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
          >
            {job.title}
          </Link>
          <p className="mt-0.5 text-xs text-ink-500">{formatBudget(job.budget)} budget</p>
        </div>
        {expanded ? <ChevronUp size={18} className="shrink-0 text-ink-500" /> : <ChevronDown size={18} className="shrink-0 text-ink-500" />}
      </button>

      {expanded && (
        <div className="border-t border-line px-5 pb-5">
          {status === "loading" && (
            <div className="space-y-3 py-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-canvas" />
              ))}
            </div>
          )}
          {status === "error" && (
            <p className="py-4 text-sm text-ink-500">Couldn't load applications for this job.</p>
          )}
          {status === "ready" && applications.length === 0 && (
            <p className="py-4 text-sm text-ink-500">No applications yet for this job.</p>
          )}
          {status === "ready" &&
            applications.map((app) => (
              <div key={app.id} className="border-t border-line py-4 first:border-t-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">Freelancer #{app.freelancer_id}</span>
                  <Badge tone={STATUS_TONE[app.status] || "neutral"}>{app.status}</Badge>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{app.cover_letter}</p>
                <p className="mt-1.5 text-xs text-ink-500">
                  Proposed {formatBudget(app.proposed_price)} · {app.estimated_days} day
                  {app.estimated_days !== 1 ? "s" : ""}
                </p>
                {app.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(app.id, "accepted")}
                      isLoading={updatingId === app.id}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleStatusChange(app.id, "rejected")}
                      isLoading={updatingId === app.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
