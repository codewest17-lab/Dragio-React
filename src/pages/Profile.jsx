import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { useFollow } from "../hooks/useFollow";
import { useFriendRequest } from "../hooks/useFriendRequest";
import DebateCard from "../components/DebateCard";
import EmptyState from "../components/EmptyState";
import { fallbackAvatar } from "../utils/formatters";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, stats, debates, voteMap, loading, notFound, isOwnProfile } = useProfile(id);
  const { isFollowing, toggle: toggleFollow } = useFollow(id);
  const { state: friendState, sendRequest, respond } = useFriendRequest(id);

  if (notFound) return <EmptyState icon="error" description="Profile not found." />;
  if (loading || !profile) return <div className="skeleton" style={{ height: 200, marginTop: 20 }} />;

  async function handleSignOut() {
    await signOut();
    navigate("/signin");
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="spread" style={{ margin: "16px 0 8px" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        {isOwnProfile && (
          <button className="action-btn" onClick={handleSignOut}>
            <span className="material-symbols-rounded">logout</span>
          </button>
        )}
      </header>

      <div className="profile-header card">
        <img className="profile-avatar" style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 8px" }} src={profile.avatar_url || fallbackAvatar(profile.username)} alt="" />
        <div className="row" style={{ justifyContent: "center", gap: 6 }}>
          <h2>{profile.username}</h2>
          {profile.is_verified && <span className="material-symbols-rounded verified-badge">verified</span>}
        </div>
        {profile.bio && <p style={{ marginTop: 6 }}>{profile.bio}</p>}
        <div className="badge-row">
          {profile.membership_tier === "premium" && <span className="category-tag" style={{ color: "var(--gold)" }}>Premium</span>}
          {profile.account_type === "business" && <span className="category-tag">Business</span>}
        </div>

        <div className="profile-stats">
          <Link to={`/user-list?type=followers&id=${profile.id}`}><span className="num">{profile.followers_count}</span><span className="label">Followers</span></Link>
          <Link to={`/user-list?type=following&id=${profile.id}`}><span className="num">{profile.following_count}</span><span className="label">Following</span></Link>
          <div><span className="num">{profile.debates_count}</span><span className="label">Debates</span></div>
        </div>
        <div className="profile-stats" style={{ marginTop: 0 }}>
          <div><span className="num">{stats.votes}</span><span className="label">Votes</span></div>
          <div><span className="num">{stats.comments}</span><span className="label">Comments</span></div>
          <div><span className="num">{stats.views}</span><span className="label">Views</span></div>
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <Link to="/edit-profile" className="btn btn-secondary">Edit Profile</Link>
              <Link to="/messages" className="btn btn-secondary">Messages</Link>
              {(profile.account_type === "business" || profile.verification_status === "none") && (
                <Link to="/business-dashboard" className="btn btn-secondary">Business</Link>
              )}
              {profile.account_type === "admin" && <Link to="/admin" className="btn btn-secondary">Admin</Link>}
            </>
          ) : (
            <>
              <button className={isFollowing ? "btn btn-secondary" : "btn btn-primary"} onClick={toggleFollow}>
                {isFollowing ? "Following" : "Follow"}
              </button>
              <FriendControl friendState={friendState} onSend={sendRequest} onRespond={respond} otherId={id} />
            </>
          )}
        </div>
      </div>

      <p className="muted" style={{ margin: "16px 0 8px" }}>Debates</p>
      {debates.length === 0 ? (
        <EmptyState icon="forum" description="No debates yet." />
      ) : (
        <div className="stack">
          {debates.map((d) => <DebateCard key={d.id} debate={d} initialMyVote={voteMap[d.id] || null} />)}
        </div>
      )}
    </div>
  );
}

function FriendControl({ friendState, onSend, onRespond, otherId }) {
  if (!friendState || friendState.status === "declined") {
    return <button className="btn btn-secondary" onClick={onSend}>Add Friend</button>;
  }
  if (friendState.status === "pending" && friendState.direction === "sent") {
    return <button className="btn btn-secondary" disabled>Request Sent</button>;
  }
  if (friendState.status === "pending" && friendState.direction === "received") {
    return (
      <>
        <button className="btn btn-primary" onClick={() => onRespond(true)}>Accept Request</button>
        <button className="btn btn-secondary" onClick={() => onRespond(false)}>Decline</button>
      </>
    );
  }
  if (friendState.status === "accepted") {
    return <Link to={`/chat/${otherId}`} className="btn btn-primary">Message</Link>;
  }
  return null;
}
