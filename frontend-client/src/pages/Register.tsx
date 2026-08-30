import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, GitBranch, KeyRound, LoaderCircle, Mail, ShieldCheck, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RobotMascot, type RobotMood } from "@/components/RobotMascot";
import { useDodge } from "@/hooks/useDodge";
import { ApiError } from "@/services/api";
import { register } from "@/services/auth";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function Register() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [justSucceeded, setJustSucceeded] = useState(false);
  const [error, setError] = useState("");

  const emailFormatInvalid = email.length > 0 && !EMAIL_RE.test(email);
  const passwordTooShortRaw = password.length > 0 && password.length < 8;
  const confirmMismatchRaw = confirmPassword.length > 0 && confirmPassword !== password;

  const emailIsInvalid = emailTouched && emailFormatInvalid;
  const passwordTooShort = passwordTouched && passwordTooShortRaw;
  const confirmMismatch = confirmTouched && confirmMismatchRaw;

  const isEvasive = !isSubmitting && !justSucceeded && (emailIsInvalid || passwordTooShort || confirmMismatch || isRejected);
  const { zoneRef, offset, fleeing, handlePointerMove, handlePointerLeave } = useDodge(isEvasive);

  const mood: RobotMood = justSucceeded
    ? "happy"
    : isRejected || passwordTooShort || confirmMismatch
      ? "confused"
      : passwordFocused || confirmFocused
        ? "shy"
        : emailFocused || email.length > 0
          ? "watching"
          : "idle";

  const confusedMessage = passwordTooShort
    ? "That password's a little short for comfort — 8 characters, please."
    : confirmMismatch
      ? "These two passwords are having a disagreement. Make them match?"
      : isRejected
        ? "Looks like that email already has a seat here — try signing in instead?"
        : undefined;

  function clearServerState() {
    setIsRejected(false);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailFormatInvalid || passwordTooShortRaw || confirmMismatchRaw) {
      setEmailTouched(true);
      setPasswordTouched(true);
      setConfirmTouched(true);
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      await register(email, password, displayName.trim() || undefined);
      setJustSucceeded(true);
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 450);
    } catch (requestError) {
      setIsRejected(true);
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "We could not connect to ForgeIQ. Check that the API is running and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel = isSubmitting
    ? "Creating account"
    : justSucceeded
      ? "Success"
      : emailIsInvalid
        ? "Enter correct email"
        : passwordTooShort
          ? "Password needs 8+ characters"
          : confirmMismatch
            ? "Passwords don't match"
            : isRejected
              ? "Fix the details above"
              : "Create account";

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
          <h2 className="auth-visual-title">Welcome to the team.</h2>
          <p className="auth-visual-copy">
            Build an evidence-led developer profile from real activity &mdash; no guessed scores, ever.
          </p>
          <RobotMascot mood={mood} message={confusedMessage} />
        </div>

        <div className="auth-form-side auth-form-side-compact">
          <div className="auth-heading">
            <span className="eyebrow">Create account</span>
            <h1>Create your ForgeIQ account</h1>
            <p>Start building your evidence-led developer profile.</p>
          </div>

          <form className="auth-form auth-form-compact" onSubmit={handleSubmit} noValidate>
            <label htmlFor="displayName">Full name</label>
            <div className="auth-input-wrap">
              <User size={17} aria-hidden="true" />
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>

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
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearServerState();
                }}
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearServerState();
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  setPasswordFocused(false);
                  setPasswordTouched(true);
                }}
                aria-invalid={passwordTooShort}
                minLength={8}
                required
              />
            </div>
            {passwordTooShort && <p className="field-error">Password must be at least 8 characters.</p>}

            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="auth-input-wrap">
              <KeyRound size={17} aria-hidden="true" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearServerState();
                }}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => {
                  setConfirmFocused(false);
                  setConfirmTouched(true);
                }}
                aria-invalid={confirmMismatch}
                minLength={8}
                required
              />
            </div>
            {confirmMismatch && <p className="field-error">Passwords don't match yet.</p>}

            {error && !emailIsInvalid && !passwordTooShort && !confirmMismatch && (
              <p className="auth-error" role="alert">{error}</p>
            )}

            <div
              className={`dodge-zone dodge-zone-compact${fleeing ? " is-fleeing" : ""}`}
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

          <p className="auth-footer"><ShieldCheck size={14} aria-hidden="true" /> Your password is hashed and never stored in plain text.</p>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
