import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { friendlyAuthError } from "../utils/formatters";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(friendlyAuthError(updateError));
      return;
    }
    setDone(true);
  }

  return (
    <div className="screen centered-screen">
      <div className="brand-mark" style={{ fontSize: 32 }}>Dragio</div>
      {done ? (
        <div className="glass" style={{ padding: 24, textAlign: "center" }}>
          <h3>Password updated</h3>
          <p style={{ marginTop: 8 }}>You can now sign in with your new password.</p>
          <Link to="/signin" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>Go to Sign In</Link>
        </div>
      ) : (
        <>
          <h2>Choose a new password</h2>
          <form onSubmit={handleSubmit} className="w-full" style={{ textAlign: "left", maxWidth: 360 }}>
            {error && <div className="form-error-banner visible">{error}</div>}
            <div className="field">
              <label>New Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Updating…" : "Update Password"}</button>
          </form>
        </>
      )}
    </div>
  );
}
