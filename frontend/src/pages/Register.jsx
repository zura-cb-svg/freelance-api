import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Briefcase, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";

export function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("freelancer");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await signup({ full_name: fullName.trim(), email: email.trim(), password, role });
      toast.success("Account created. Log in to continue.");
      navigate("/login");
    } catch (err) {
      setErrors({ form: err.friendlyMessage || "Couldn't create your account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] max-w-md items-center py-12">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-ink-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Already on Forge?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="card mt-7 flex flex-col gap-4 p-6">
          {errors.form && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <div>
            <span className="field-label">I want to</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("freelancer")}
                className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                  role === "freelancer"
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-line text-ink-500 hover:bg-canvas"
                }`}
              >
                <User size={18} /> Find work
              </button>
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                  role === "client"
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-line text-ink-500 hover:bg-canvas"
                }`}
              >
                <Briefcase size={18} /> Hire talent
              </button>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="full-name">
              Full name
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="field-input"
              placeholder="Jordan Rivera"
              autoComplete="name"
            />
            {errors.fullName && <p className="field-error">{errors.fullName}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input pr-10"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full py-2.5">
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
}
