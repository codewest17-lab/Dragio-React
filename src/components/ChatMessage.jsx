import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ChatMessage({ message, readReceiptsEnabled, onEdit, onDelete }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const mine = message.sender_id === user.id;
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    showToast("Copied");
  }

  if (message.is_deleted) {
    return (
      <div className={`msg-row ${mine ? "mine-row" : ""}`}>
        <div className={`chat-msg ${mine ? "mine" : "theirs"} deleted`}>
          <em>Message deleted</em>
          <span className="msg-time">{time}</span>
        </div>
      </div>
    );
  }

  const seen = mine && message.read_at && readReceiptsEnabled;

  return (
    <div className={`msg-row ${mine ? "mine-row" : ""}`}>
      <div className={`chat-msg ${mine ? "mine" : "theirs"}`}>
        {message.content}
        <span className="msg-time">
          {message.edited_at && <span className="edited-tag">edited</span>}
          {time}
          {mine && (
            <span className={`material-symbols-rounded ${seen ? "seen-tick" : ""}`}>{seen ? "done_all" : "done"}</span>
          )}
        </span>
      </div>
      <div className="msg-actions">
        <button title="Copy" onClick={handleCopy}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>content_copy</span></button>
        {mine && (
          <>
            <button title="Edit" onClick={() => onEdit(message)}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span></button>
            <button title="Delete" onClick={() => onDelete(message.id)}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span></button>
          </>
        )}
      </div>
    </div>
  );
}
