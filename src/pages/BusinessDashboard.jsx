import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessDashboard } from "../hooks/useBusinessDashboard";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { business, totals, myDebates, campaigns, loading, createBusiness, createCampaign } = useBusinessDashboard();

  if (loading) return <div className="skeleton" style={{ height: 120, marginTop: 20 }} />;

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "16px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>Business Dashboard</h2>
      </header>

      {!business ? (
        <CreateBusinessForm onCreate={createBusiness} />
      ) : (
        <>
          <div className="card center">
            <h3>{business.business_name}</h3>
            <div className="badge-row" style={{ marginTop: 6 }}>
              {business.is_pro ? (
                <span className="category-tag" style={{ color: "var(--gold)" }}>Business Pro</span>
              ) : (
                <span className="category-tag">Free Plan</span>
              )}
            </div>
          </div>

          <p className="muted" style={{ margin: "4px 0" }}>Analytics across your debates</p>
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="card stat-card" style={{ padding: 14, textAlign: "center" }}><span className="num">{totals.votes}</span><span className="label">Total Votes</span></div>
            <div className="card stat-card" style={{ padding: 14, textAlign: "center" }}><span className="num">{totals.comments}</span><span className="label">Comments</span></div>
            <div className="card stat-card" style={{ padding: 14, textAlign: "center" }}><span className="num">{totals.views}</span><span className="label">Views</span></div>
            <div className="card stat-card" style={{ padding: 14, textAlign: "center" }}><span className="num">{totals.shares}</span><span className="label">Shares</span></div>
          </div>

          {!business.is_pro && (
            <div className="card" style={{ marginTop: 16 }}>
              <strong>Business Pro</strong>
              <p style={{ marginTop: 4 }}>Unlocks sponsored debates and deeper analytics.</p>
              <button className="btn btn-secondary" disabled style={{ marginTop: 12 }}>Upgrade — payments coming soon</button>
            </div>
          )}

          <CampaignSection myDebates={myDebates} campaigns={campaigns} onCreate={createCampaign} />
        </>
      )}
    </div>
  );
}

function CreateBusinessForm({ onCreate }) {
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onCreate({ businessName: businessName.trim(), websiteUrl: websiteUrl.trim() });
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="card">
      <h3>Create your Business Page</h3>
      <p style={{ marginTop: 6 }}>Businesses can post debates, ask customers for feedback, and (once payments are connected) run sponsored campaigns.</p>
      <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 16, textAlign: "left" }}>
        {error && <div className="form-error-banner visible">{error}</div>}
        <div className="field">
          <label>Business Name</label>
          <input type="text" required maxLength={80} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="field">
          <label>Website (optional)</label>
          <input type="url" placeholder="https://" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating…" : "Create Business Page"}</button>
      </form>
    </div>
  );
}

function CampaignSection({ myDebates, campaigns, onCreate }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="spread" style={{ marginTop: 20 }}>
        <p className="muted">Sponsored Campaigns</p>
        <button className="btn-text" onClick={() => setShowForm((v) => !v)}>+ New Campaign</button>
      </div>

      {showForm && <CampaignForm myDebates={myDebates} onCreate={onCreate} onDone={() => setShowForm(false)} />}

      <div className="card">
        {campaigns.length === 0 ? (
          <p className="muted">No campaigns yet.</p>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="campaign-row" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--glass-border)" }}>
              <div>
                <div style={{ fontSize: 14 }}>{c.debates?.title || "Untitled debate"}</div>
                <div className="muted" style={{ fontSize: 12 }}>${(c.budget_cents / 100).toFixed(2)} · {c.impressions} impressions · {c.clicks} clicks</div>
              </div>
              <span className={`status-pill ${c.is_active ? "active" : "pending"}`}>{c.is_active ? "Active" : "Pending payment"}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function CampaignForm({ myDebates, onCreate, onDone }) {
  const [debateId, setDebateId] = useState(myDebates[0]?.id || "");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (myDebates.length === 0) {
    return <div className="notice-banner" style={{ marginBottom: 12 }}>Create a debate first — you need at least one to sponsor.</div>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onCreate({ debateId, budgetUsd: Number(budget), days: Number(days) });
      onDone();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="notice-banner">
        Campaigns are created here as <strong>pending</strong> and won't go live until payment processing
        is connected (Stripe or similar). Nothing is charged yet.
      </div>
      <form onSubmit={handleSubmit} className="stack" style={{ textAlign: "left" }}>
        {error && <div className="form-error-banner visible">{error}</div>}
        <div className="field">
          <label>Debate</label>
          <select value={debateId} onChange={(e) => setDebateId(e.target.value)}>
            {myDebates.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Budget (USD)</label>
          <input type="number" min={5} step="0.01" required value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="25.00" />
        </div>
        <div className="field">
          <label>Run for (days)</label>
          <input type="number" min={1} max={30} required value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating…" : "Create Pending Campaign"}</button>
      </form>
    </div>
  );
}
