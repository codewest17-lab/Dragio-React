import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAdminGate, useAdminStats } from "../hooks/useAdmin";
import EmptyState from "../components/EmptyState";

const TABS = ["reports", "verification", "users", "categories", "businesses"];

export default function Admin() {
  const navigate = useNavigate();
  const isAdmin = useAdminGate();
  const stats = useAdminStats();
  const [tab, setTab] = useState("reports");

  if (isAdmin === null) return null;
  if (!isAdmin) return <EmptyState icon="lock" description="You don't have access to this page." />;

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "16px 0 12px" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>Admin</h2>
      </header>

      {stats && (
        <>
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 4 }}>
            <StatCard num={stats.total_users} label="Users" />
            <StatCard num={stats.total_debates} label="Debates" />
            <StatCard num={stats.total_comments} label="Comments" />
            <StatCard num={stats.pending_reports} label="Pending Reports" />
            <StatCard num={stats.pending_verifications} label="Pending Verifications" />
            <StatCard num={`$${(stats.total_revenue_cents / 100).toFixed(0)}`} label="Pledged Revenue*" />
          </div>
          <p className="muted" style={{ fontSize: 11, marginBottom: 16 }}>
            *Sum of campaign budgets, including unpaid pending campaigns — not reconciled against a payment processor.
          </p>
        </>
      )}

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "reports" && <ReportsPanel />}
      {tab === "verification" && <VerificationPanel />}
      {tab === "users" && <UsersPanel />}
      {tab === "categories" && <CategoriesPanel />}
      {tab === "businesses" && <BusinessesPanel />}
    </div>
  );
}

function StatCard({ num, label }) {
  return (
    <div className="card stat-card" style={{ padding: 14, textAlign: "center" }}>
      <span className="num">{num}</span><span className="label">{label}</span>
    </div>
  );
}

function ReportsPanel() {
  const [reports, setReports] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("id, target_type, target_id, reason, created_at, reporter:reporter_id ( username )")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setReports(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(r) {
    await supabase.rpc("admin_moderate_content", { p_target_type: r.target_type, p_target_id: r.target_id });
    await supabase.rpc("admin_resolve_report", { p_report_id: r.id, p_status: "actioned" });
    setReports((prev) => prev.filter((x) => x.id !== r.id));
  }

  async function handleDismiss(r) {
    await supabase.rpc("admin_resolve_report", { p_report_id: r.id, p_status: "dismissed" });
    setReports((prev) => prev.filter((x) => x.id !== r.id));
  }

  if (reports === null) return null;
  if (reports.length === 0) return <EmptyState icon="check_circle" description="No pending reports." />;

  return reports.map((r) => (
    <div key={r.id} className="admin-row">
      <div className="info">
        <div className="title">{r.target_type} reported by {r.reporter?.username || "unknown"}</div>
        <div className="meta">"{r.reason}"</div>
      </div>
      <div className="actions">
        <button className="btn btn-danger" onClick={() => handleRemove(r)}>Remove content</button>
        <button className="btn btn-secondary" onClick={() => handleDismiss(r)}>Dismiss</button>
      </div>
    </div>
  ));
}

function VerificationPanel() {
  const [requests, setRequests] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("verification_requests")
      .select("id, reason, supporting_url, user:user_id ( username )")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function respond(id, approve) {
    await supabase.rpc("admin_decide_verification", { p_request_id: id, p_approve: approve });
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  if (requests === null) return null;
  if (requests.length === 0) return <EmptyState icon="verified" description="No pending verification requests." />;

  return requests.map((v) => (
    <div key={v.id} className="admin-row">
      <div className="info">
        <div className="title">{v.user?.username || "unknown"}</div>
        <div className="meta">{v.reason}{v.supporting_url && <> · <a href={v.supporting_url} target="_blank" rel="noreferrer" style={{ color: "var(--side-b)" }}>link</a></>}</div>
      </div>
      <div className="actions">
        <button className="btn btn-success" onClick={() => respond(v.id, true)}>Approve</button>
        <button className="btn btn-danger" onClick={() => respond(v.id, false)}>Reject</button>
      </div>
    </div>
  ));
}

function UsersPanel() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);

  const runSearch = useCallback(async () => {
    let req = supabase.from("profiles").select("id, username, is_banned, ban_reason, account_type, debates_count").order("created_at", { ascending: false }).limit(30);
    if (query.trim()) req = req.ilike("username", `%${query.trim()}%`);
    const { data } = await req;
    setUsers(data || []);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [runSearch]);

  async function toggleBan(u) {
    if (u.is_banned) {
      await supabase.rpc("admin_set_user_banned", { p_user_id: u.id, p_banned: false });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_banned: false, ban_reason: null } : x)));
    } else {
      const reason = prompt("Reason for ban?") || "Violation of platform guidelines";
      await supabase.rpc("admin_set_user_banned", { p_user_id: u.id, p_banned: true, p_reason: reason });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_banned: true, ban_reason: reason } : x)));
    }
  }

  return (
    <>
      <input
        type="search"
        placeholder="Search by username…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--text)", marginBottom: 12 }}
      />
      {users.map((u) => (
        <div key={u.id} className="admin-row">
          <div className="info">
            <div className="title">{u.username} <span className="muted" style={{ fontSize: 12 }}>({u.account_type})</span></div>
            <div className="meta">{u.debates_count} debates{u.is_banned && ` · banned: ${u.ban_reason || "no reason given"}`}</div>
          </div>
          <div className="actions">
            <button className={`btn ${u.is_banned ? "btn-success" : "btn-danger"}`} onClick={() => toggleBan(u)}>{u.is_banned ? "Unban" : "Ban"}</button>
          </div>
        </div>
      ))}
    </>
  );
}

function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("categories").select("id, name, is_active").order("name");
    setCategories(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(cat) {
    await supabase.from("categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    load();
  }

  async function addCategory(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await supabase.from("categories").insert({ name, slug });
    setNewName("");
    load();
  }

  return (
    <>
      <form onSubmit={addCategory} className="row" style={{ marginBottom: 12, gap: 8 }}>
        <input
          type="text" placeholder="New category name" required value={newName} onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--text)" }}
        />
        <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "10px 16px" }}>Add</button>
      </form>
      {categories.map((c) => (
        <div key={c.id} className="admin-row">
          <div className="info"><div className="title">{c.name}</div></div>
          <div className="actions">
            <button className={`btn ${c.is_active ? "btn-danger" : "btn-success"}`} onClick={() => toggle(c)}>{c.is_active ? "Deactivate" : "Activate"}</button>
          </div>
        </div>
      ))}
    </>
  );
}

function BusinessesPanel() {
  const [businesses, setBusinesses] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("business_profiles").select("id, business_name, is_pro, profiles:id ( username )").order("created_at", { ascending: false });
    setBusinesses(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePro(b) {
    await supabase.from("business_profiles").update({ is_pro: !b.is_pro }).eq("id", b.id);
    load();
  }

  if (businesses === null) return null;
  if (businesses.length === 0) return <EmptyState icon="business_center" description="No business accounts yet." />;

  return businesses.map((b) => (
    <div key={b.id} className="admin-row">
      <div className="info">
        <div className="title">{b.business_name}</div>
        <div className="meta">@{b.profiles?.username}</div>
      </div>
      <div className="actions">
        <button className={`btn ${b.is_pro ? "btn-danger" : "btn-success"}`} onClick={() => togglePro(b)}>{b.is_pro ? "Revoke Pro" : "Grant Pro"}</button>
      </div>
    </div>
  ));
}
