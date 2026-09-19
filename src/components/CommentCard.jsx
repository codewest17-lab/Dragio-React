import { Link } from "react-router-dom";
import { timeAgo, fallbackAvatar } from "../utils/formatters";

export default function CommentCard({
  comment, debateAuthorId, liked, isMindChanger, mindChangedLocked,
  onLike, onReply, onMindChange, replyDebates = [],
}) {
  return (
    <div className="comment">
      <Link to={`/profile/${comment.author_id}`}>
        <img className="avatar" style={{ width: 28, height: 28 }} src={comment.profiles?.avatar_url || fallbackAvatar(comment.profiles?.username)} alt="" />
      </Link>
      <div className="body">
        <Link to={`/profile/${comment.author_id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <span className="username">{comment.profiles?.username || "unknown"}</span>
        </Link>
        {comment.profiles?.is_verified && <span className="material-symbols-rounded verified-badge" style={{ fontSize: "13px !important" }}>verified</span>}
        {comment.author_id === debateAuthorId && (
          <span className="category-tag" style={{ color: "var(--gold)", fontSize: 10 }}>Creator</span>
        )}
        <span className="muted" style={{ fontSize: 12 }}>· {timeAgo(comment.created_at)}</span>
        <p className="bubble">{comment.content}</p>
        <div className="comment-meta">
          <button className={liked ? "liked" : ""} onClick={() => onLike(comment.id)}>
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>favorite</span>{comment.likes_count}
          </button>
          <button onClick={() => onReply(comment)}>Reply</button>
          <Link to={`/create-debate?replyTo=${comment.id}`} className="reply-with-debate-btn">
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>forum</span>Reply with Debate
          </Link>
          <button
            className={isMindChanger ? "active mind-changed-btn" : "mind-changed-btn"}
            disabled={mindChangedLocked && !isMindChanger}
            onClick={() => onMindChange(comment.id)}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>psychology</span>
            {isMindChanger ? "Changed my mind" : "This changed my mind"}
          </button>
        </div>
        {replyDebates.length > 0 && (
          <div className="reply-debates-list">
            {replyDebates.map((d) => (
              <Link key={d.id} to={`/debate/${d.id}`}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>forum</span>{d.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
