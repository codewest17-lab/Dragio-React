import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDebateDetail } from "../hooks/useDebateDetail";
import { useComments } from "../hooks/useComments";
import DebateCard from "../components/DebateCard";
import CommentCard from "../components/CommentCard";
import EmptyState from "../components/EmptyState";
import { DebateCardSkeleton } from "../components/LoadingSkeleton";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "top", label: "Top" },
  { key: "controversial", label: "Controversial" },
];

export default function DebateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { debate, myVote, replyContext, loading, notFound } = useDebateDetail(id);
  const {
    sortMode, setSortMode, topLevel, repliesByParent, replyDebatesByComment,
    likedIds, mindChangedCommentId, postComment, toggleLike, markMindChanged,
  } = useComments(id);

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const content = commentText.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      await postComment(content, replyingTo?.id || null);
      setCommentText("");
      setReplyingTo(null);
    } catch {
      alert("Couldn't post that comment.");
    }
    setSubmitting(false);
  }

  if (notFound) return <EmptyState icon="error" title="This debate couldn't be loaded." />;

  return (
    <div style={{ paddingBottom: 8 }}>
      <header className="row" style={{ margin: "16px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
      </header>

      {loading || !debate ? (
        <DebateCardSkeleton />
      ) : (
        <>
          {replyContext && (
            <Link to={`/debate/${replyContext.debate_id}`} className="card" style={{ display: "block", textDecoration: "none", color: "inherit", marginBottom: 16 }}>
              <p className="muted" style={{ fontSize: 12 }}>Responding to a comment on "{replyContext.debates?.title}"</p>
              <p style={{ fontSize: 13, marginTop: 6, fontStyle: "italic" }}>@{replyContext.profiles?.username || "someone"}: "{replyContext.content}"</p>
            </Link>
          )}

          <DebateCard debate={debate} initialMyVote={myVote} />

          <div className="sort-bar" style={{ display: "flex", gap: 8, margin: "20px 0 8px" }}>
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.key} className={`sort-chip ${sortMode === opt.key ? "active" : ""}`} onClick={() => setSortMode(opt.key)}>
                {opt.label}
              </button>
            ))}
          </div>

          <div id="comment-list">
            {topLevel.length === 0 ? (
              <EmptyState icon="chat_bubble" description="No comments yet. Make the first case." />
            ) : (
              topLevel.map((comment) => (
                <div key={comment.id}>
                  <CommentCard
                    comment={comment}
                    debateAuthorId={debate.author_id}
                    liked={likedIds.has(comment.id)}
                    isMindChanger={mindChangedCommentId === comment.id}
                    mindChangedLocked={Boolean(mindChangedCommentId)}
                    onLike={toggleLike}
                    onReply={setReplyingTo}
                    onMindChange={markMindChanged}
                    replyDebates={replyDebatesByComment[comment.id] || []}
                  />
                  {(repliesByParent[comment.id] || []).length > 0 && (
                    <div className="replies">
                      {repliesByParent[comment.id].map((reply) => (
                        <CommentCard
                          key={reply.id}
                          comment={reply}
                          debateAuthorId={debate.author_id}
                          liked={likedIds.has(reply.id)}
                          isMindChanger={mindChangedCommentId === reply.id}
                          mindChangedLocked={Boolean(mindChangedCommentId)}
                          onLike={toggleLike}
                          onReply={setReplyingTo}
                          onMindChange={markMindChanged}
                          replyDebates={replyDebatesByComment[reply.id] || []}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {replyingTo && (
        <div className="reply-target visible">
          Replying to <strong>@{replyingTo.profiles?.username}</strong>
          <button type="button" onClick={() => setReplyingTo(null)}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      )}
      <form className="comment-composer" onSubmit={handleSubmit}>
        <textarea
          placeholder="Make your case…"
          maxLength={1000}
          required
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>Post</button>
      </form>
    </div>
  );
}
