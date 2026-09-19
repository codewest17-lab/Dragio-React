import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import EmptyState from "../components/EmptyState";
import { timeAgo } from "../utils/formatters";

const ICONS = {
  comment: "chat_bubble", reply: "reply", follow: "person_add", comment_like: "favorite",
  debate_follow: "forum", mind_changed: "psychology", verification_approved: "verified",
  verification_rejected: "info", debate_sponsored: "campaign", message: "mail",
  friend_request: "person_add", friend_accepted: "how_to_reg", collab_invite: "handshake",
  collab_accepted: "handshake", collab_declined: "info", debate_reply: "forum",
};

const COPY = {
  comment: (a) => <><strong>{a}</strong> commented on your debate</>,
  reply: (a) => <><strong>{a}</strong> replied to your comment</>,
  follow: (a) => <><strong>{a}</strong> started following you</>,
  comment_like: (a) => <><strong>{a}</strong> liked your comment</>,
  debate_follow: (a) => <><strong>{a}</strong> is active on a debate you follow</>,
  mind_changed: (a) => <><strong>{a}</strong>'s argument changed someone's mind</>,
  verification_approved: () => "You're verified! The badge is now on your profile.",
  verification_rejected: () => "Your verification request wasn't approved this time.",
  debate_sponsored: () => "Your debate is now sponsored.",
  message: (a) => <><strong>{a}</strong> sent you a message</>,
  friend_request: (a) => <><strong>{a}</strong> sent you a friend request</>,
  friend_accepted: (a) => <><strong>{a}</strong> accepted your friend request</>,
  collab_invite: (a) => <><strong>{a}</strong> invited you to co-debate</>,
  collab_accepted: (a) => <><strong>{a}</strong> accepted your co-debate invite</>,
  collab_declined: (a) => <><strong>{a}</strong> declined your co-debate invite</>,
  debate_reply: (a) => <><strong>{a}</strong> replied to your comment with a whole debate</>,
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, actionStatus, markRead, markAllRead, respondFriendRequest, respondCollabInvite } = useNotifications();

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="spread" style={{ margin: "16px 0" }}>
        <div className="row">
          <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h2 style={{ fontSize: 20 }}>Notifications</h2>
        </div>
        <button className="btn-text" onClick={markAllRead}>Mark all read</button>
      </header>

      {notifications === null ? null : notifications.length === 0 ? (
        <EmptyState icon="notifications" description="Nothing yet — activity on your debates will show up here." />
      ) : (
        notifications.map((n) => (
          <NotificationRow
            key={n.id}
            notification={n}
            actionStatus={actionStatus}
            onMarkRead={markRead}
            onRespondFriend={respondFriendRequest}
            onRespondCollab={respondCollabInvite}
          />
        ))
      )}
    </div>
  );
}

function NotificationRow({ notification: n, actionStatus, onMarkRead, onRespondFriend, onRespondCollab }) {
  const [actionResult, setActionResult] = useState(null); // "accepted" | "declined" | "error" | null
  const [busy, setBusy] = useState(false);

  let actionRow = null;
  if (n.type === "friend_request" && n.actor) actionRow = actionStatus.friendRequests.get(n.actor.id) || null;
  if (n.type === "collab_invite" && n.debate_id) actionRow = actionStatus.collabInvites.get(n.debate_id) || null;

  const isPendingAction = actionRow?.status === "pending";
  const actorName = n.actor?.username || "Someone";
  const copyFn = COPY[n.type] || (() => "New activity on Dragio");

  async function respond(accept) {
    setBusy(true);
    try {
      if (n.type === "friend_request") await onRespondFriend(actionRow.id, accept);
      else await onRespondCollab(actionRow.id, accept);
      setActionResult(accept ? "accepted" : "declined");
    } catch {
      setActionResult("error");
    }
    setBusy(false);
  }

  const content = (
    <>
      <div className="notif-icon"><span className="material-symbols-rounded" style={{ fontSize: 18 }}>{ICONS[n.type] || "notifications"}</span></div>
      <div className="text">
        <div>{copyFn(actorName)}</div>
        <div className="time">{timeAgo(n.created_at)}</div>
        {actionRow && (
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            {actionResult === "accepted" && <span className="muted" style={{ fontSize: 13 }}>Accepted</span>}
            {actionResult === "declined" && <span className="muted" style={{ fontSize: 13 }}>Declined</span>}
            {actionResult === "error" && <span className="field-error" style={{ fontSize: 13 }}>Couldn't respond — try reloading.</span>}
            {!actionResult && !isPendingAction && <span className="muted" style={{ fontSize: 13 }}>{actionRow.status === "accepted" ? "Accepted" : "Declined"}</span>}
            {!actionResult && isPendingAction && (
              <>
                <button className="btn btn-primary" style={{ width: "auto", padding: "6px 16px", fontSize: 13 }} disabled={busy} onClick={(e) => { e.preventDefault(); respond(true); }}>Accept</button>
                <button className="btn btn-secondary" style={{ width: "auto", padding: "6px 16px", fontSize: 13 }} disabled={busy} onClick={(e) => { e.preventDefault(); respond(false); }}>Decline</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );

  const className = `notif-row ${n.is_read ? "" : "unread"}`;

  if (n.type === "message" && n.actor) {
    return <Link to={`/chat/${n.actor.id}`} className={className} onClick={() => !n.is_read && onMarkRead(n.id)}>{content}</Link>;
  }
  if (!actionRow && n.debate_id) {
    return <Link to={`/debate/${n.debate_id}`} className={className} onClick={() => !n.is_read && onMarkRead(n.id)}>{content}</Link>;
  }
  return <div className={className} onClick={() => !n.is_read && onMarkRead(n.id)}>{content}</div>;
}
