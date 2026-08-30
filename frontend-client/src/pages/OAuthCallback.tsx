import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "@/services/auth";

export function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");

    if (token) {
      setAccessToken(token);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login?oauth_error=1", { replace: true });
    }
  }, [navigate]);

  return (
    <main className="auth-shell">
      <div className="auth-body" style={{ gridTemplateColumns: "1fr" }}>
        <div className="auth-form-side" style={{ alignItems: "center", textAlign: "center" }}>
          <LoaderCircle className="animate-spin" size={28} />
          <p style={{ marginTop: 14, color: "var(--muted)" }}>Signing you in with Google&hellip;</p>
        </div>
      </div>
    </main>
  );
}
