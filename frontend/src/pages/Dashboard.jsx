import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Zap, Users } from "lucide-react";
import { getJobs } from "../api/jobs";
import { JobCard } from "../components/jobs/JobCard";
import { JobCardSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Verified job postings", detail: "Every listing comes straight from a registered client account." },
  { icon: Zap, label: "Fast applications", detail: "Send a proposal with your rate and timeline in under a minute." },
  { icon: Users, label: "Built for both sides", detail: "One clean workspace for clients hiring and freelancers applying." },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const loadFeatured = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getJobs({ limit: 6, offset: 0 });
      setJobs(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query ? `/jobs?search=${encodeURIComponent(query)}` : "/jobs");
  };

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="font-display text-[2.5rem] font-medium leading-[1.1] tracking-tight text-ink-900 sm:text-5xl"
            >
              Find work that moves your career forward.
            </motion.h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-500">
              Forge connects clients with real projects to freelancers ready to deliver them —
              transparent budgets, direct applications, no middlemen.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex max-w-lg flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jobs, skills, or keywords..."
                  className="field-input pl-10"
                  aria-label="Search jobs"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-2.5">
                Search jobs
              </button>
            </form>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
                <div key={label}>
                  <Icon size={18} className="text-brand-500" strokeWidth={1.75} />
                  <p className="mt-2 text-sm font-semibold text-ink-900">{label}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="card h-full p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Live on Forge right now</p>
              <div className="mt-4 space-y-3">
                {status === "ready" &&
                  jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="rounded-lg border border-line p-3.5">
                      <p className="truncate text-sm font-medium text-ink-900">{job.title}</p>
                      <p className="mt-1 text-xs text-ink-500">${job.budget.toLocaleString()} budget</p>
                    </div>
                  ))}
                {status === "loading" &&
                  [0, 1, 2].map((i) => <div key={i} className="h-[62px] animate-pulse rounded-lg bg-canvas" />)}
                {status === "ready" && jobs.length === 0 && (
                  <p className="text-sm text-ink-500">No jobs posted yet — be the first.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink-900">Recently posted</h2>
            <p className="mt-1 text-sm text-ink-500">Fresh opportunities from clients on Forge.</p>
          </div>
          <button onClick={() => navigate("/jobs")} className="hidden text-sm font-medium text-brand-600 hover:text-brand-700 sm:block">
            Browse all jobs
          </button>
        </div>

        {status === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        )}

        {status === "error" && (
          <EmptyState
            title="We couldn't load jobs"
            description="There was a problem reaching the server. Please try again."
            action={
              <button onClick={loadFeatured} className="btn-primary px-4 py-2 text-sm">
                Retry
              </button>
            }
          />
        )}

        {status === "ready" && jobs.length === 0 && (
          <EmptyState
            title="No jobs found"
            description="There aren't any jobs posted yet. Check back soon, or post one if you're a client."
          />
        )}

        {status === "ready" && jobs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/jobs")}
          className="btn-secondary mt-8 w-full py-2.5 sm:hidden"
        >
          Browse all jobs
        </button>
      </section>
    </div>
  );
}
