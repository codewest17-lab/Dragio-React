import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { friendlyAuthError } from "../utils/formatters";
import { useCategories } from "../hooks/useCategories";

const STEPS = ["welcome", "how-it-works", "interests", "signup"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState(new Set());
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const navigate = useNavigate();

  const { categories } = useCategories();

  function toggleInterest(id) {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSignup({ username, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) throw error;

    const interestIds = Array.from(selectedInterests);

    if (data.session) {
      await supabase.from("user_interests").insert(interestIds.map((category_id) => ({ user_id: data.user.id, category_id })));
      await supabase.rpc("complete_onboarding", { p_user_id: data.user.id });
      navigate("/home");
      return;
    }

    localStorage.setItem("dragio_pending_interests", JSON.stringify({ userId: data.user.id, interestIds }));
    setPendingConfirmation(email);
  }

  return (
    <div className="screen centered-screen">
      {step === 0 && (
        <>
          <div className="brand-mark">Dragio</div>
          <p className="slogan">Where Opinions Collide</p>
          <ProgressDots active={0} />
          <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={() => setStep(1)}>Continue</button>
          <p className="muted" style={{ fontSize: 14 }}>
            Already have an account? <Link to="/signin" style={{ color: "var(--side-b)", fontWeight: 600 }}>Sign In</Link>
          </p>
        </>
      )}

      {step === 1 && (
        <>
          <h2>How Dragio Works</h2>
          <div className="onboarding-list glass" style={{ padding: 24 }}>
            <div className="item">
              <span className="material-symbols-rounded">forum</span>
              <div><strong>Create debates</strong><p>Post a topic with two or more sides. Let the public weigh in.</p></div>
            </div>
            <div className="item">
              <span className="material-symbols-rounded">how_to_vote</span>
              <div><strong>Vote before seeing results</strong><p>No results peeking — cast your vote first, always.</p></div>
            </div>
            <div className="item">
              <span className="material-symbols-rounded">chat_bubble</span>
              <div><strong>Join conversations</strong><p>Make your case in the comments. Change some minds.</p></div>
            </div>
          </div>
          <ProgressDots active={1} />
          <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={() => setStep(2)}>Continue</button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Choose Your Interests</h2>
          <p className="muted">Pick at least 5 topics — we'll build your feed around them.</p>
          <div className="chip-grid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip ${selectedInterests.has(cat.id) ? "selected" : ""}`}
                onClick={() => toggleInterest(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <p className="chip-count">{selectedInterests.size} selected</p>
          <ProgressDots active={2} />
          <button className="btn btn-primary" style={{ maxWidth: 280 }} disabled={selectedInterests.size < 5} onClick={() => setStep(3)}>
            Continue
          </button>
        </>
      )}

      {step === 3 && (
        <SignupForm onSubmit={handleSignup} pendingConfirmation={pendingConfirmation} />
      )}
    </div>
  );
}

function ProgressDots({ active }) {
  return (
    <div className="progress-dots">
      {STEPS.map((_, i) => <span key={i} className={i === active ? "active" : ""} />)}
    </div>
  );
}

function SignupForm({ onSubmit, pendingConfirmation }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (pendingConfirmation) {
    return (
      <div className="glass" style={{ padding: 24, textAlign: "center" }}>
        <span className="material-symbols-rounded" style={{ fontSize: 40, color: "var(--side-b)" }}>mail</span>
        <h3 style={{ marginTop: 12 }}>Check your email</h3>
        <p style={{ marginTop: 8 }}>We sent a confirmation link to <strong>{pendingConfirmation}</strong>. Click it to activate your account.</p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(friendlyAuthError(err));
    }
    setLoading(false);
  }

  return (
    <>
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit} className="w-full" style={{ textAlign: "left", maxWidth: 360 }}>
        {error && <div className="form-error-banner visible">{error}</div>}
        <div className="field">
          <label>Username</label>
          <input type="text" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="yourname" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" required minLength={6} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat your password" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>
      </form>
      <ProgressDots active={3} />
      <p className="muted" style={{ fontSize: 14 }}>
        Already have an account? <Link to="/signin" style={{ color: "var(--side-b)", fontWeight: 600 }}>Sign In</Link>
      </p>
    </>
  );
}
