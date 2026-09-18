import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export function JobFilters({ initialValues, onApply }) {
  const [search, setSearch] = useState(initialValues.search || "");
  const [minBudget, setMinBudget] = useState(initialValues.minBudget || "");
  const [maxBudget, setMaxBudget] = useState(initialValues.maxBudget || "");
  const [showFilters, setShowFilters] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    onApply({ search, minBudget, maxBudget });
    setShowFilters(false);
  };

  const clearBudget = () => {
    setMinBudget("");
    setMaxBudget("");
    onApply({ search, minBudget: "", maxBudget: "" });
  };

  const hasBudgetFilter = minBudget !== "" || maxBudget !== "";

  return (
    <form onSubmit={submit} className="card p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, skills, or keywords..."
            className="field-input pl-10"
            aria-label="Search jobs"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="btn-secondary justify-between px-4 py-2.5 sm:w-auto"
          aria-expanded={showFilters}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Budget
            {hasBudgetFilter && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
            )}
          </span>
        </button>

        <button type="submit" className="btn-primary px-5 py-2.5">
          Search
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor="min-budget">
              Min budget (USD)
            </label>
            <input
              id="min-budget"
              type="number"
              min="0"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder="0"
              className="field-input"
            />
          </div>
          <div className="flex-1">
            <label className="field-label" htmlFor="max-budget">
              Max budget (USD)
            </label>
            <input
              id="max-budget"
              type="number"
              min="0"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="No limit"
              className="field-input"
            />
          </div>
          <div className="flex gap-2">
            {hasBudgetFilter && (
              <button type="button" onClick={clearBudget} className="btn-ghost px-3 py-2.5">
                <X size={15} /> Clear
              </button>
            )}
            <button type="submit" className="btn-secondary px-4 py-2.5">
              Apply
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
