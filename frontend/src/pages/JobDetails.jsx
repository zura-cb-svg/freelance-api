import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Wallet, User, Pencil, Trash2, ArrowLeft, AlertTriangle, MessageSquare } from "lucide-react";
import { findJobById, deleteJob } from "../api/jobs";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { ApplyModal } from "../components/applications/ApplyModal";
import { formatBudget } from "../utils/format";

export function JobDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState(location.state?.job || null);
  const [status, setStatus] = useState(location.state?.job ? "ready" : "loading");
  const [showDelete, setShowDelete] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    // If we didn't arrive with job data already in hand (e.g. a direct link
    // or a page refresh), fall back to searching the paginated job list -
    // the backend has no GET /jobs/{id} endpoint yet.
    if (job) return;
    let cancelled = false;
    setStatus("loading");
    findJobById(id)
      .then((found) => {
        if (cancelled) return;
        setJob(found);
        setStatus(found ? "ready" : "not-found");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [id, job]);

  const isOwner = isAuthenticated && job && user?.id === job.owner_id;
  const canApply = isAuthenticated && user?.role === "freelancer" && !isOwner;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteJob(job.id);
      toast.success("Job deleted.");
      navigate("/jobs");
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't delete this job.");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container-page max-w-3xl py-10">
        <div className="card animate-pulse space-y-4 p-8">
          <div className="h-6 w-2/3 rounded bg-line" />
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-5/6 rounded bg-line" />
          <div className="h-4 w-1/3 rounded bg-line" />
        </div>
      </div>
    );
  }

  if (status === "not-found" || status === "error" || !job) {
    return (
      <div className="container-page max-w-lg py-16 text-center">
        <AlertTriangle className="mx-auto text-ink-300" size={32} />
        <h1 className="mt-4 text-lg font-semibold text-ink-900">
          {status === "error" ? "Something went wrong" : "Job not found"}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {status === "error"
            ? "We couldn't load this job right now. Please try again."
            : "This job may have been removed or the link is incorrect."}
        </p>
        <Link to="/jobs" className="btn-primary mt-6 inline-flex px-5 py-2.5">
          Browse jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-tight text-ink-900">{job.title}</h1>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
            <Wallet size={14} />
            {formatBudget(job.budget)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
          <User size={14} /> Posted by {job.owner?.full_name || `Client #${job.owner_id}`}
        </div>

        <div className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">
          {job.description}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
          {isOwner && (
            <>
              <Link to={`/jobs/${job.id}/edit`} state={{ job }} className="btn-secondary flex-1 py-2.5">
                <Pencil size={15} /> Edit job
              </Link>
              <Button variant="danger" onClick={() => setShowDelete(true)} className="flex-1 py-2.5">
                <Trash2 size={15} /> Delete job
              </Button>
            </>
          )}

          {isAuthenticated && !isOwner && (
            <Button
              variant="secondary"
              onClick={() => navigate("/messages", { state: { receiverId: job.owner_id } })}
              className="flex-1 py-2.5 flex items-center justify-center gap-2"
            >
              <MessageSquare size={15} /> Message Client
            </Button>
          )}

          {canApply && !applied && (
            <Button onClick={() => setShowApply(true)} className="flex-1 py-2.5">
              Apply to this job
            </Button>
          )}

          {canApply && applied && (
            <div className="flex-1 rounded-lg bg-brand-50 py-2.5 text-center text-sm font-medium text-brand-700">
              Application sent
            </div>
          )}

          {!isAuthenticated && (
            <Link to="/login" state={{ from: location }} className="btn-primary flex-1 py-2.5">
              Log in to apply
            </Link>
          )}

          {isAuthenticated && user?.role === "client" && !isOwner && (
            <p className="flex-1 self-center text-center text-sm text-ink-500">
              Only freelancer accounts can apply to jobs.
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete this job?"
        description="This can't be undone. The job listing and its applications will be removed."
        confirmLabel="Delete job"
        isLoading={isDeleting}
      />

      <ApplyModal
        isOpen={showApply}
        onClose={() => setShowApply(false)}
        job={job}
        onApplied={() => setApplied(true)}
      />
    </div>
  );
}
