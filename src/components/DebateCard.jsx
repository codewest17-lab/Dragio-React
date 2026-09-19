import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDebateRealtime } from "../hooks/useDebateRealtime";
import { useBookmark } from "../hooks/useBookmark";
import { timeAgo, fallbackAvatar } from "../utils/formatters";
import FollowPill from "./FollowPill";
import VoteOptions from "./VoteOptions";

export default function DebateCard({ debate, initialMyVote = null }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { options, counts } = useDebateRealtime(debate.id, debate.debate_options, {
    comments_count: debate.comments_count,
    views_count: debate.views_count,
    bookmarks_count: debate.bookmarks_count,
    mind_changed_count: debate.mind_changed_count,
  });
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(debate.id);
  const [localShares, setLocalShares] = useState(debate.shares_count);

  const isCollab = Boolean(debate.option_b_champion) && options.length >= 2;
  const championFor = (position) => {
    if (!isCollab) return null;
    if (position === 0) return debate.option_a_champion;
    if (position === 1) return debate.option_b_champion;
    return null;
  };

  async function handleShare() {
    const url = `${window.location.origin}/debate/${debate.id}`;
    if (navigator.share) {
      navigator.share({ title: debate.title, text: `${debate.title} — Vote before seeing the results on Dragio.`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    }
    const next = localShares + 1;
    setLocalShares(next);
    supabase.from("debates").update({ shares_count: next }).eq("id", debate.id).then(() => {});
  }

  async function handleReport() {
    const reason = prompt("Why are you reporting this debate?");
    if (!reason || !user) return;
    await supabase.from("reports").insert({ reporter_id: user.id, target_type: "debate", target_id: debate.id, reason });
    showToast("Thanks — our team will review this.");
  }

  return (
    <article className="card debate-card">
      <div className="meta-row">
        <Link to={`/profile/${debate.author_id}`} className="row" style={{ gap: 8, textDecoration: "none", color: "inherit" }}>
          <img className="avatar" src={debate.profiles?.avatar_url || fallbackAvatar(debate.profiles?.username)} alt="" />
          <span className="username">{debate.profiles?.username || "unknown"}</span>
          {debate.profiles?.is_verified && <span className="material-symbols-rounded verified-badge">verified</span>}
        </Link>
        <span className="category-tag">{debate.categories?.name || "General"}</span>
        <span>·</span>
        <span>{timeAgo(debate.created_at)}</span>
        {debate.is_sponsored && <span className="sponsored-label">Sponsored</span>}
        <FollowPill authorId={debate.author_id} />
      </div>

      <h3 className="debate-title">{debate.title}</h3>
      <p className="debate-description">{debate.description}</p>
      {debate.image_url && <img className="debate-image" src={debate.image_url} alt="" />}

      {isCollab && (
        <div className="row" style={{ justifyContent: "center", gap: 10, padding: "4px 0" }}>
          <img className="avatar" style={{ width: 24, height: 24 }} src={debate.option_a_champion?.avatar_url || fallbackAvatar(debate.option_a_champion?.username)} alt="" />
          <span className="muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>VS</span>
          <img className="avatar" style={{ width: 24, height: 24 }} src={debate.option_b_champion?.avatar_url || fallbackAvatar(debate.option_b_champion?.username)} alt="" />
        </div>
      )}

      <VoteOptions debateId={debate.id} options={options} initialMyVote={initialMyVote} championFor={championFor} />

      <div className="debate-actions">
        <Link to={`/debate/${debate.id}`} className="action-btn">
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chat_bubble</span>{counts.comments_count}
        </Link>
        <span className="action-btn"><span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>{counts.views_count}</span>
        <button className={`action-btn ${isBookmarked ? "active" : ""}`} onClick={toggleBookmark}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>bookmark</span>{counts.bookmarks_count}
        </button>
        <button className="action-btn" onClick={handleShare}><span className="material-symbols-rounded" style={{ fontSize: 18 }}>share</span></button>
        <button className="action-btn" onClick={handleReport}><span className="material-symbols-rounded" style={{ fontSize: 18 }}>flag</span></button>
        <span className="action-btn"><span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--gold)" }}>psychology</span>{counts.mind_changed_count}</span>
      </div>
    </article>
  );
}
