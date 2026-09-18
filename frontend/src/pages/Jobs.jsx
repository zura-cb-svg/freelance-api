import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { getJobs } from "../api/jobs";
import { JobCard } from "../components/jobs/JobCard";
import { JobFilters } from "../components/jobs/JobFilters";
import { JobCardSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";

const PAGE_SIZE = 9;

export function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const search = searchParams.get("search") || "";
  const minBudget = searchParams.get("min") || "";
  const maxBudget = searchParams.get("max") || "";

  const fetchJobs = useCallback(
    async (currentOffset, replace) => {
      if (replace) setStatus("loading");
      else setIsLoadingMore(true);
      try {
        const data = await getJobs({
          search,
          minBudget,
          maxBudget,
          limit: PAGE_SIZE,
          offset: currentOffset,
        });
        setJobs((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
        setStatus("ready");
      } catch {
        setStatus("error");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [search, minBudget, maxBudget]
  );

  useEffect(() => {
    setOffset(0);
    fetchJobs(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, minBudget, maxBudget]);

  const applyFilters = ({ search: s, minBudget: min, maxBudget: max }) => {
    const params = {};
    if (s) params.search = s;
    if (min) params.min = min;
    if (max) params.max = max;
    setSearchParams(params);
  };

  const loadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    fetchJobs(nextOffset, false);
  };

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Browse jobs</h1>
        <p className="mt-1 text-sm text-ink-500">Search by keyword or narrow down by budget.</p>
      </div>

      <JobFilters initialValues={{ search, minBudget, maxBudget }} onApply={applyFilters} />

      <div className="mt-8">
        {status === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        )}

        {status === "error" && (
          <EmptyState
            icon={Briefcase}
            title="We couldn't load jobs"
            description="There was a problem reaching the server. Please try again."
            action={
              <Button onClick={() => fetchJobs(0, true)} size="sm">
                Retry
              </Button>
            }
          />
        )}

        {status === "ready" && jobs.length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={
              search || minBudget || maxBudget
                ? "Try widening your search or clearing your budget filters."
                : "There aren't any jobs posted yet. Check back soon."
            }
          />
        )}

        {status === "ready" && jobs.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={loadMore} isLoading={isLoadingMore}>
                  Load more jobs
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
