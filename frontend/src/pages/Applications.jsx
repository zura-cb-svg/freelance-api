import { useEffect, useState } from "react";
import { Briefcase, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyApplications } from "../api/applications";
import { getMyJobs } from "../api/users";
import { ApplicationRow } from "../components/applications/ApplicationRow";
import { JobApplicationsCard } from "../components/applications/JobApplicationsCard";
import { EmptyState } from "../components/ui/EmptyState";
import { JobCardSkeleton } from "../components/ui/Skeleton";

function FreelancerApplications() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = () => {
    setStatus("loading");
    getMyApplications()
      .then((data) => {
        setApplications(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  if (status === "loading") {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-line/50" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't load your applications"
        description="Something went wrong. Please try again."
        action={
          <button onClick={load} className="btn-primary px-4 py-2 text-sm">
            Retry
          </button>
        }
      />
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Your applications will appear here"
        description="Apply to jobs and track their status from this page."
        action={
          <Link to="/jobs" className="btn-primary px-4 py-2 text-sm">
            Browse jobs
          </Link>
        }
      />
    );
  }

  return (
    <div className="card px-5">
      {applications.map((app) => (
        <ApplicationRow key={app.id} application={app} />
      ))}
    </div>
  );
}

function ClientJobs() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = () => {
    setStatus("loading");
    getMyJobs()
      .then((data) => {
        setJobs(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  if (status === "loading") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't load your jobs"
        description="Something went wrong. Please try again."
        action={
          <button onClick={load} className="btn-primary px-4 py-2 text-sm">
            Retry
          </button>
        }
      />
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="You haven't posted any jobs yet"
        description="Post a job to start receiving applications from freelancers."
        action={
          <Link to="/jobs/new" className="btn-primary px-4 py-2 text-sm">
            Post a job
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobApplicationsCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export function Applications() {
  const { user } = useAuth();
  const isClient = user?.role === "client";

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-semibold text-ink-900">
        {isClient ? "My jobs" : "My applications"}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {isClient
          ? "Review and manage applications submitted to your job postings."
          : "Track the status of every job you've applied to."}
      </p>
      <div className="mt-6">{isClient ? <ClientJobs /> : <FreelancerApplications />}</div>
    </div>
  );
}
