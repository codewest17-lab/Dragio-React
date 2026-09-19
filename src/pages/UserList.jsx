import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import { fallbackAvatar } from "../utils/formatters";

export default function UserList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profileId = searchParams.get("id");
  const type = searchParams.get("type") === "following" ? "following" : "followers";

  const [people, setPeople] = useState(null);
  const [myFollowing, setMyFollowing] = useState(new Set());

  useEffect(() => {
    if (!profileId || !user) return;
    let cancelled = false;

    (async () => {
      const query = type === "followers"
        ? supabase.from("follows").select("profiles:follower_id ( id, username, avatar_url, is_verified, followers_count )").eq("following_id", profileId)
        : supabase.from("follows").select("profiles:following_id ( id, username, avatar_url, is_verified, followers_count )").eq("follower_id", profileId);

      const { data } = await query;
      const rows = (data || []).map((r) => r.profiles).filter(Boolean);

      const { data: myFollows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);

      if (!cancelled) {
        setPeople(rows);
        setMyFollowing(new Set((myFollows || []).map((f) => f.following_id)));
      }
    })();

    return () => { cancelled = true; };
  }, [profileId, type, user]);

  async function toggleFollow(targetId) {
    if (myFollowing.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setMyFollowing((prev) => { const next = new Set(prev); next.delete(targetId); return next; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setMyFollowing((prev) => new Set(prev).add(targetId));
    }
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "16px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>{type === "following" ? "Following" : "Followers"}</h2>
      </header>

      {people === null ? null : people.length === 0 ? (
        <EmptyState icon="group" description="Nobody here yet." />
      ) : (
        people.map((p) => (
          <div key={p.id} className="user-row">
            <Link to={`/profile/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none" }}>
              <img className="avatar" src={p.avatar_url || fallbackAvatar(p.username)} alt="" />
              <div>
                <div className="row" style={{ gap: 4 }}>
                  <span className="username">{p.username}</span>
                  {p.is_verified && <span className="material-symbols-rounded verified-badge" style={{ fontSize: "15px !important" }}>verified</span>}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{p.followers_count} followers</div>
              </div>
            </Link>
            {p.id !== user.id && (
              <button className={myFollowing.has(p.id) ? "btn btn-secondary" : "btn btn-primary"} onClick={() => toggleFollow(p.id)}>
                {myFollowing.has(p.id) ? "Following" : "Follow"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
