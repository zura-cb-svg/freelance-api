import { useNavigate } from "react-router-dom";
import { createJob } from "../api/jobs";
import { JobForm } from "../components/jobs/JobForm";
import { useToast } from "../context/ToastContext";

export function CreateJob() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (values) => {
    try {
      const job = await createJob(values);
      toast.success("Job posted.");
      navigate(`/jobs/${job.id}`, { state: { job } });
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't post this job.");
    }
  };

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-semibold text-ink-900">Post a job</h1>
      <p className="mt-1 text-sm text-ink-500">
        Give freelancers what they need to send you a strong proposal.
      </p>
      <div className="card mt-6 p-6 sm:p-8">
        <JobForm onSubmit={handleSubmit} submitLabel="Post job" />
      </div>
    </div>
  );
}
