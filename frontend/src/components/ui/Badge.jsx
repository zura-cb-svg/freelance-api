const STYLES = {
  neutral: "bg-canvas text-ink-500 border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-brand-50 text-brand-700 border-brand-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${STYLES[tone] || STYLES.neutral}`}
    >
      {children}
    </span>
  );
}
