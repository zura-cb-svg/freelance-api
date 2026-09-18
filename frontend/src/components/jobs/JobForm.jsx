import { useState } from "react";
import { Button } from "../ui/Button";

export function JobForm({ initialValues, onSubmit, submitLabel = "Post job" }) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [budget, setBudget] = useState(initialValues?.budget ?? "");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (title.trim().length < 3) next.title = "Title must be at least 3 characters.";
    if (description.trim().length < 10) next.description = "Add a bit more detail (at least 10 characters).";
    if (!budget || Number(budget) <= 0) next.budget = "Budget must be greater than zero.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), budget: Number(budget) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="field-label" htmlFor="job-title">
          Job title
        </label>
        <input
          id="job-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Build a responsive marketing website"
          className="field-input"
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div>
        <label className="field-label" htmlFor="job-description">
          Description
        </label>
        <textarea
          id="job-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={7}
          placeholder="Describe the scope of work, deliverables, and any relevant context..."
          className="field-input resize-none"
        />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>

      <div>
        <label className="field-label" htmlFor="job-budget">
          Budget (USD)
        </label>
        <input
          id="job-budget"
          type="number"
          min="1"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="1500"
          className="field-input max-w-xs"
        />
        {errors.budget && <p className="field-error">{errors.budget}</p>}
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="submit" isLoading={isSubmitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
