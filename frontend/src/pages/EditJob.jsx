import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { findJobById, updateJob } from "../api/jobs";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { JobForm } from "../components/jobs/JobForm";

export function EditJob() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState(location.state?.job || null);
  const [status, setStatus] = useState(location.state?.job ? "ready" : "loading");

  useEffect(() => {
    if (job) return;
    findJobById(id)
      .then((found) => {
        setJob(found);
        setStatus(found ? "ready" : "not-found");
      })
      .catch(() => setStatus("error"));
  }, [id, job]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-ink-300" size={28} />
      </div>
    );
  }

  if (status !== "ready" || !job) {
    return (
      <div className="container-page max-w-lg py-16 text-center">
        <AlertTriangle className="mx-auto text-ink-300" size={32} />
        <h1 className="mt-4 text-lg font-semibold text-ink-900">Job not found</h1>
        <Link to="/jobs" className="btn-primary mt-6 inline-flex px-5 py-2.5">
          Browse jobs
        </Link>
      </div>
    );
  }

  if (job.owner_id !== user?.id) {
    return (
      <div className="container-page max-w-lg py-16 text-center">
        <AlertTriangle className="mx-auto text-ink-300" size={32} />
        <h1 className="mt-4 text-lg font-semibold text-ink-900">You can't edit this job</h1>
        <p className="mt-2 text-sm text-ink-500">Only the client who posted this job can make changes.</p>
        <Link to={`/jobs/${job.id}`} className="btn-secondary mt-6 inline-flex px-5 py-2.5">
          Back to job
        </Link>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    try {
      const updated = await updateJob(job.id, values);
      toast.success("Job updated.");
      navigate(`/jobs/${job.id}`, { state: { job: updated } });
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't update this job.");
    }
  };

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-semibold text-ink-900">Edit job</h1>
      <p className="mt-1 text-sm text-ink-500">Update the details freelancers will see.</p>
      <div className="card mt-6 p-6 sm:p-8">
        <JobForm initialValues={job} onSubmit={handleSubmit} submitLabel="Save changes" />
      </div>
    </div>
  );
}
