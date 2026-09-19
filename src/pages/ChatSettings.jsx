import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function ChatSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("read_receipts_enabled").eq("id", user.id).single().then(({ data }) => {
      setEnabled(data?.read_receipts_enabled ?? true);
    });
  }, [user]);

  async function handleToggle() {
    const next = !enabled;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ read_receipts_enabled: next }).eq("id", user.id);
    setBusy(false);
    if (!error) setEnabled(next);
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
    </div>
  );
}
