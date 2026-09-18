import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-5xl font-medium text-ink-900">404</p>
      <h1 className="mt-3 text-lg font-semibold text-ink-900">Page not found</h1>
      <p className="mt-1.5 text-sm text-ink-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6 px-5 py-2.5">
        Back to home
      </Link>
    </div>
  );
}
