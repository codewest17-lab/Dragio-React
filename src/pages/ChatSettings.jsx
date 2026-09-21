import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function ChatSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const { permission, subscribe, subscribing, error, isSupported, isConfigured } = usePushNotifications(user?.id);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("read_receipts_enabled").eq("id", user.id).single().then(({ data }) => {
      setEnabled(data?.read_receipts_enabled ?? true);
    });
  }, [user]);

  async function handleToggle() {
    const next = !enabled;
    setBusy(true);
    const { error: toggleError } = await supabase.from("profiles").update({ read_receipts_enabled: next }).eq("id", user.id);
    setBusy(false);
    if (!toggleError) setEnabled(next);
  }

  return (
    <div>
      <header className="row" style={{ margin: "20px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>Chat Settings</h2>
      </header>

      <div className="setting-row">
        <div className="info">
          <div className="title">Read Receipts</div>
          <div className="desc">Let friends see when you've read their messages. Turning this off also means you won't see when they've read yours.</div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={enabled} disabled={busy} onChange={handleToggle} />
          <span className="slider" />
        </label>
      </div>

      {isSupported && isConfigured && (
        <div className="setting-row">
          <div className="info">
            <div className="title">Push Notifications</div>
            <div className="desc">
              Get notified about messages, comments, and follows even when Dragio isn't open.
              {permission === "denied" && " Currently blocked — you'll need to reset this in your browser's site settings before enabling it here."}
            </div>
            {error && <div className="field-error" style={{ marginTop: 6 }}>{error}</div>}
          </div>
          {permission === "granted" ? (
            <span className="category-tag" style={{ color: "var(--success)" }}>Enabled</span>
          ) : (
            <button className="btn btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: 13 }} disabled={subscribing || permission === "denied"} onClick={subscribe}>
              {subscribing ? "Enabling…" : "Enable"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
