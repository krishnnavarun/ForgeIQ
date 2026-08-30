import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GitBranch,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RobotMascot, type RobotMood } from "@/components/RobotMascot";
import { useDodge } from "@/hooks/useDodge";
import { ApiError } from "@/services/api";
import { getGoogleAuthUrl, login } from "@/services/auth";

type LoginLocationState = { from?: string };

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const WRONG_PASSWORD_LINES = [
  "Nope, that's not it. Even I don't remember my own password half the time.",
  "404: correct password not found. One more try?",
  "That password and I have never met. Try again?",
  "Close, but no compile. Re-check that password.",
  "Hmm, my circuits say no. Give it another shot.",
  "Not quite — I promise I'm not judging. Try again?",
];

function pickJoke(previous: string) {
  const options = WRONG_PASSWORD_LINES.filter((line) => line !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LoginLocationState | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [justSucceeded, setJustSucceeded] = useState(false);
  const [error, setError] = useState("");
  const [oauthFailed, setOauthFailed] = useState(
    () => new URLSearchParams(location.search).get("oauth_error") === "1",
  );
  const [joke, setJoke] = useState("");
  const lastJoke = useRef("");

  useEffect(() => {
    if (oauthFailed) {
      navigate(location.pathname, { replace: true });
    }
  }, [oauthFailed, location.pathname, navigate]);

  const emailFormatInvalid = email.length > 0 && !EMAIL_RE.test(email);
  const emailIsInvalid = emailTouched && emailFormatInvalid;
  const isEvasive = !isSubmitting && !justSucceeded && (emailIsInvalid || isRejected);
  const { zoneRef, offset, fleeing, handlePointerMove, handlePointerLeave } = useDodge(isEvasive);

  const mood: RobotMood = justSucceeded
    ? "happy"
    : isRejected || oauthFailed
      ? "confused"
      : passwordFocused
        ? "shy"
        : emailFocused || email.length > 0
          ? "watching"
          : "idle";

  function updateEmail(value: string) {
    setEmail(value);
    setIsRejected(false);
    setOauthFailed(false);
    setError("");
  }

  function updatePassword(value: string) {
    setPassword(value);
    setIsRejected(false);
    setOauthFailed(false);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailFormatInvalid) {
      setEmailTouched(true);
      return;
    }
    if (isRejected) return;
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      setJustSucceeded(true);
      window.setTimeout(() => navigate(from, { replace: true }), 450);
    } catch (requestError) {
      setIsRejected(true);
      const nextJoke = pickJoke(lastJoke.current);
      lastJoke.current = nextJoke;
      setJoke(nextJoke);
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not connect to ForgeIQ. Check that the API is running and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    window.location.href = getGoogleAuthUrl();
  }

  const submitLabel = isSubmitting
    ? "Signing in"
    : justSucceeded
      ? "Success"
      : emailIsInvalid
        ? "Enter correct email"
        : isRejected
          ? "Re-enter your password"
          : "Sign in";

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <Link to="/" className="auth-logo">
          <span className="brand-mark"><GitBranch size={17} strokeWidth={2.5} /></span>
          ForgeIQ
        </Link>
      </header>

      <div className="auth-body">
        <div className="auth-visual">
          <h2 className="auth-visual-title">Signal, not noise.</h2>
          <p className="auth-visual-copy">
            Your co-pilot for sign-in &mdash; watching, reacting, and rooting for you to get it right.
          </p>
          <RobotMascot
            mood={mood}
            message={isRejected ? joke : oauthFailed ? "Google didn't come through. Let's try email instead." : undefined}
          />
        </div>

        <div className="auth-form-side">
          <div className="auth-heading">
            <span className="eyebrow">Member access</span>
            <h1>Sign in to ForgeIQ</h1>
            <p>Continue building your developer profile.</p>
          </div>

          {oauthFailed && <p className="auth-error" role="alert">Google sign-in didn't go through. Please try again.</p>}

          <button type="button" className="oauth-button" onClick={handleGoogleSignIn}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-divider">or continue with email</div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => updateEmail(event.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  setEmailTouched(true);
                }}
                aria-invalid={emailIsInvalid}
                aria-describedby={emailIsInvalid ? "email-help" : undefined}
                required
              />
            </div>
            {emailIsInvalid && <p id="email-help" className="field-error">Use an address in the format you@example.com.</p>}

            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="auth-input-wrap">
              <KeyRound size={17} aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => updatePassword(event.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                minLength={8}
                required
              />
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <div
              className={`dodge-zone${fleeing ? " is-fleeing" : ""}`}
              ref={zoneRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              <Button
                type="submit"
                size="lg"
                className={`auth-submit${isEvasive ? " is-evasive" : ""}`}
                disabled={isSubmitting || isEvasive}
                aria-disabled={isEvasive}
                style={fleeing ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
              >
                {isSubmitting ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={17} />}
                {submitLabel}
              </Button>
            </div>
          </form>

          <p className="auth-footer"><ShieldCheck size={14} aria-hidden="true" /> Protected with secure, revocable session authentication.</p>
          <p className="auth-switch">New to ForgeIQ? <Link to="/register">Create an account</Link></p>
        </div>
      </div>
    </main>
  );
}
