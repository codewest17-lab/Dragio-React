import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { friendlyAuthError } from "../utils/formatters";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function applyPendingInterests(userId) {
    const raw = localStorage.getItem("dragio_pending_interests");
    if (!raw) return;
    try {
      const { userId: pendingUserId, interestIds } = JSON.parse(raw);
      if (pendingUserId !== userId || !interestIds?.length) return;
      await supabase.from("user_interests").insert(interestIds.map((category_id) => ({ user_id: userId, category_id })));
      await supabase.rpc("complete_onboarding", { p_user_id: userId });
    } catch {
      /* non-fatal */
    } finally {
      localStorage.removeItem("dragio_pending_interests");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (signInError) {
      setLoading(false);
      setError(friendlyAuthError(signInError));
      return;
    }

    await applyPendingInterests(data.user.id);
    navigate("/home");
  }

  return (
    <div className="screen centered-screen">
      <div className="brand-mark" style={{ fontSize: 32 }}>Dragio</div>
      <h2>Welcome back</h2>
      <form onSubmit={handleSubmit} className="w-full" style={{ textAlign: "left", maxWidth: 360 }}>
        {error && <div className="form-error-banner visible">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        <p className="center" style={{ marginTop: 16 }}>
          <Link to="/forgot-password" style={{ color: "var(--side-b)", fontWeight: 600, fontSize: 14 }}>Forgot Password?</Link>
        </p>
      </form>
      <p className="muted" style={{ fontSize: 14 }}>
        Don't have an account? <Link to="/" style={{ color: "var(--side-b)", fontWeight: 600 }}>Sign Up</Link>
      </p>
    </div>
  );
}
