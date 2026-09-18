import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { applyToJob } from "../../api/applications";
import { useToast } from "../../context/ToastContext";

export function ApplyModal({ isOpen, onClose, job, onApplied }) {
  const toast = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (coverLetter.trim().length < 10) {
      next.coverLetter = "Tell the client why you're a good fit (at least 10 characters).";
    }
    if (!proposedPrice || Number(proposedPrice) <= 0) {
      next.proposedPrice = "Enter a proposed price greater than zero.";
    }
    if (!estimatedDays || Number(estimatedDays) <= 0) {
      next.estimatedDays = "Enter an estimated duration greater than zero.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await applyToJob(job.id, {
        cover_letter: coverLetter.trim(),
        proposed_price: Number(proposedPrice),
        estimated_days: Number(estimatedDays),
      });
      toast.success("Your application was sent.");
      setCoverLetter("");
      setProposedPrice("");
      setEstimatedDays("");
      onApplied?.();
      onClose();
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't submit your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply to "${job?.title ?? ""}"`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="cover-letter">
            Cover letter
          </label>
          <textarea
            id="cover-letter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
            placeholder="Explain why you're the right person for this job..."
            className="field-input resize-none"
          />
          {errors.coverLetter && <p className="field-error">{errors.coverLetter}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="proposed-price">
              Your rate (USD)
            </label>
            <input
              id="proposed-price"
              type="number"
              min="1"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              placeholder="500"
              className="field-input"
            />
            {errors.proposedPrice && <p className="field-error">{errors.proposedPrice}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="estimated-days">
              Timeline (days)
            </label>
            <input
              id="estimated-days"
              type="number"
              min="1"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="7"
              className="field-input"
            />
            {errors.estimatedDays && <p className="field-error">{errors.estimatedDays}</p>}
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Send application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
