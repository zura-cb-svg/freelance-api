import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Briefcase, MessageSquare, User, LogOut, Plus, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/format";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "text-brand-600" : "text-ink-700 hover:text-ink-900"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display text-base font-semibold text-white">
              F
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-ink-900">Forge</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/jobs">Find Work</NavItem>
            {isAuthenticated && user?.role === "client" && (
              <NavItem to="/jobs/new">Post a Job</NavItem>
            )}
            {isAuthenticated && <NavItem to="/messages">Messages</NavItem>}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 hover:bg-canvas"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {initials(user?.full_name) || <User size={14} />}
                </span>
                <span className="text-sm font-medium text-ink-700">
                  {user?.full_name?.split(" ")[0] || "Account"}
                </span>
                <ChevronDown size={14} className="text-ink-500" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 animate-fade-in rounded-lg border border-line bg-surface py-1.5 shadow-raised">
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-700 hover:bg-canvas"
                  >
                    <User size={16} /> Profile
                  </Link>
                  <Link
                    to="/applications"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-700 hover:bg-canvas"
                  >
                    <Briefcase size={16} />
                    {user?.role === "client" ? "My Jobs" : "My Applications"}
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-700 hover:bg-canvas"
                  >
                    <MessageSquare size={16} /> Messages
                  </Link>
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost px-4 py-2 text-sm">
                Log in
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-ink-700 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="animate-slide-up border-t border-line bg-surface px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              to="/jobs"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-canvas"
            >
              Find Work
            </Link>
            {isAuthenticated && user?.role === "client" && (
              <Link
                to="/jobs/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-canvas"
              >
                <Plus size={16} /> Post a Job
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-canvas"
                >
                  Messages
                </Link>
                <Link
                  to="/applications"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-canvas"
                >
                  {user?.role === "client" ? "My Jobs" : "My Applications"}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:bg-canvas"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-1 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary w-full py-2.5"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full py-2.5"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
