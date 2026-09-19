import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import { usePresence } from "../hooks/usePresence";
import { useConfirm } from "../hooks/useConfirm";
import ChatMessage from "../components/ChatMessage";
import EmptyState from "../components/EmptyState";
import { fallbackAvatar } from "../utils/formatters";

export default function Chat() {
  const { peerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, areFriends, peerTyping, readReceiptsEnabled, sendMessage, editMessage, deleteMessage, notifyTyping } = useChat(peerId);
  const { isOnline } = usePresence(user?.id);
  const { confirm, ConfirmModal } = useConfirm();

  const [peer, setPeer] = useState(null);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    supabase.from("profiles").select("username, avatar_url").eq("id", peerId).single().then(({ data }) => setPeer(data));
  }, [peerId]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    setSending(true);
    try {
      if (editingId) {
        await editMessage(editingId, content);
        setEditingId(null);
      } else {
        await sendMessage(content);
      }
      setInput("");
    } catch {
      alert("Couldn't send that message.");
    }
    setSending(false);
  }

  async function handleDelete(messageId) {
    const ok = await confirm("Delete this message? This can't be undone.");
    if (!ok) return;
    try {
      await deleteMessage(messageId);
    } catch {
      alert("Couldn't delete that message.");
    }
  }

  function handleEdit(message) {
    setEditingId(message.id);
    setInput(message.content);
  }

  if (!peer) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: 0 }}>
      <header className="row" style={{ margin: "16px 0 4px" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate("/messages")}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="row" style={{ gap: 0 }}>
          <img className="avatar" src={fallbackAvatar(peer.username)} alt="" style={{ width: 32, height: 32 }} />
          <span className={`online-dot ${isOnline(peerId) ? "online" : ""}`} />
        </div>
        <div>
          <div className="username">{peer.username}</div>
          <div className="muted" style={{ fontSize: 11 }}>{isOnline(peerId) ? "Online" : ""}</div>
        </div>
      </header>

      <main ref={messagesRef} className="stack" style={{ flex: 1, overflowY: "auto", paddingBottom: 4 }}>
        {areFriends === null ? null : !areFriends ? (
          <div className="not-friends-notice">
            <span className="material-symbols-rounded" style={{ fontSize: 32 }}>lock</span>
            <p style={{ marginTop: 8 }}>You can only message mutual friends. Visit their profile to send a friend request first.</p>
            <Link to={`/profile/${peerId}`} className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex", width: "auto", padding: "10px 20px" }}>View Profile</Link>
          </div>
        ) : messages === null ? null : messages.length === 0 ? (
          <EmptyState icon="waving_hand" description="Say hi — you're now friends." />
        ) : (
          messages.map((m) => (
            <ChatMessage key={m.id} message={m} readReceiptsEnabled={readReceiptsEnabled} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </main>

      <div className="typing-indicator">{peerTyping ? "typing…" : ""}</div>

      {areFriends && (
        <form className="chat-composer" onSubmit={handleSubmit}>
          {editingId && (
            <div className="edit-banner visible">
              Editing message
              <button type="button" onClick={() => { setEditingId(null); setInput(""); }}>Cancel</button>
            </div>
          )}
          <div className="chat-composer-row">
            <input
              type="text"
              placeholder="Type a message…"
              maxLength={2000}
              required
              value={input}
              onChange={(e) => { setInput(e.target.value); notifyTyping(); }}
            />
            <button type="submit" className="btn btn-primary" disabled={sending}>{editingId ? "Save" : "Send"}</button>
          </div>
        </form>
      )}

      {ConfirmModal}
    </div>
  );
}
