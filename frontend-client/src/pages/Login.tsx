import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, GitBranch, LoaderCircle, LockKeyhole } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/services/api";
import { login } from "@/services/auth";

type LoginLocationState = { from?: string };

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LoginLocationState | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not connect to ForgeIQ. Check that the API is running and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
      <section className="login-panel">
        <div className="login-story">
          <Link to="/" className="login-brand">
            <span className="brand-mark"><GitBranch size={18} strokeWidth={2.5} /></span>
            ForgeIQ
          </Link>
          <div className="login-story-copy">
            <p className="eyebrow">Developer intelligence workspace</p>
            <h1>Make your work <em>legible.</em></h1>
            <p>Bring your projects, activity, and next opportunity into one calm, trusted workspace.</p>
          </div>
          <div className="login-signal" aria-label="ForgeIQ data signal">
            <span className="signal-line" />
            <div>
              <strong>Signal, not noise</strong>
              <span>Evidence-led developer profiles</span>
            </div>
          </div>
        </div>

        <div className="login-form-wrap">
          <div className="login-heading">
            <div className="login-icon"><LockKeyhole size={20} /></div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to ForgeIQ</h2>
            <p>Continue building your developer profile.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="password-input-wrap">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <Button type="submit" size="lg" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={17} />}
              {isSubmitting ? "Signing in" : "Sign in"}
            </Button>
          </form>

          <p className="login-footer">Need an account? Registration will be available next.</p>
        </div>
      </section>
    </main>
  );
}