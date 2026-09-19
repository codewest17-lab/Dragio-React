import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import { timeAgo, fallbackAvatar } from "../utils/formatters";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_my_conversations").then(({ data }) => setConversations(data || []));
  }, [user]);

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="spread" style={{ margin: "16px 0" }}>
        <div className="row">
          <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h2 style={{ fontSize: 20 }}>Messages</h2>
        </div>
        <Link to="/chat-settings" className="action-btn"><span className="material-symbols-rounded">settings</span></Link>
      </header>

      {conversations === null ? null : conversations.length === 0 ? (
        <EmptyState icon="chat" description="No conversations yet. Add a friend from their profile to start messaging." />
      ) : (
        conversations.map((c) => (
          <Link key={c.friend_id} to={`/chat/${c.friend_id}`} className="conv-row">
            <img className="avatar" src={fallbackAvatar(c.username)} alt="" />
            <div className="info">
              <div className="row" style={{ gap: 4 }}>
                <span className="username">{c.username}</span>
                {c.is_verified && <span className="material-symbols-rounded verified-badge" style={{ fontSize: "15px !important" }}>verified</span>}
              </div>
              <div className="last-msg">{c.last_message ? `${c.last_message_from_me ? "You: " : ""}${c.last_message}` : "Say hi 👋"}</div>
            </div>
            <div className="row" style={{ flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {c.last_message_at && <span className="time">{timeAgo(c.last_message_at)}</span>}
              {c.unread_count > 0 && <span className="unread-count">{c.unread_count}</span>}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
