import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-xs font-semibold text-white">
            F
          </span>
          <span className="text-sm font-medium text-ink-700">Forge</span>
        </div>
        <p className="text-sm text-ink-500">© {new Date().getFullYear()} Forge. Built as a portfolio project.</p>
        <div className="flex items-center gap-5 text-sm text-ink-500">
          <Link to="/jobs" className="hover:text-ink-900">
            Find Work
          </Link>
          <Link to="/login" className="hover:text-ink-900">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  );
}
