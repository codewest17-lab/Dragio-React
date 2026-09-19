import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { friendlyAuthError } from "../utils/formatters";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(friendlyAuthError(resetError));
      return;
    }
    setSuccess(true);
    setEmail("");
  }

  return (
    <div className="screen centered-screen">
      <div className="brand-mark" style={{ fontSize: 32 }}>Dragio</div>
      <h2>Reset your password</h2>
      <p className="muted">Enter the email on your account — we'll send a reset link.</p>
      <form onSubmit={handleSubmit} className="w-full" style={{ textAlign: "left", maxWidth: 360 }}>
        {error && <div className="form-error-banner visible">{error}</div>}
        {success && <div className="glass" style={{ padding: 16, marginBottom: 16, textAlign: "center" }}>Check your email for a reset link.</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Sending…" : "Send Reset Link"}</button>
      </form>
      <p className="muted" style={{ fontSize: 14 }}>
        <Link to="/signin" style={{ color: "var(--side-b)", fontWeight: 600 }}>Back to Sign In</Link>
      </p>
    </div>
  );
}
