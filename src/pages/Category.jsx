import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import DebateCard from "../components/DebateCard";
import EmptyState from "../components/EmptyState";
import { DebateFeedSkeleton } from "../components/LoadingSkeleton";

const DEBATE_SELECT = `
  id, author_id, title, description, image_url,
  comments_count, views_count, shares_count, bookmarks_count, mind_changed_count,
  is_sponsored, created_at,
  profiles:author_id ( username, avatar_url, is_verified ),
  categories:category_id ( name ),
  option_a_champion:option_a_champion_id ( username, avatar_url ),
  option_b_champion:option_b_champion_id ( username, avatar_url ),
  debate_options ( id, label, position, votes_count )
`;

export default function Category() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categoryName, setCategoryName] = useState("Category");
  const [debates, setDebates] = useState(null);
  const [voteMap, setVoteMap] = useState({});

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;

    (async () => {
      const { data: category } = await supabase.from("categories").select("name").eq("id", id).single();
      if (!cancelled) setCategoryName(category?.name || "Category");

      const { data } = await supabase.from("debates").select(DEBATE_SELECT).eq("is_deleted", false).eq("category_id", id).order("trending_score", { ascending: false });
      if (cancelled) return;
      setDebates(data || []);

      if (data?.length) {
        const { data: votes } = await supabase.from("votes").select("debate_id, option_id").eq("user_id", user.id).in("debate_id", data.map((d) => d.id));
        const map = {};
        (votes || []).forEach((v) => (map[v.debate_id] = v.option_id));
        if (!cancelled) setVoteMap(map);
      }
    })();

    return () => { cancelled = true; };
  }, [id, user]);

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "16px 0" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>{categoryName}</h2>
      </header>

      {debates === null ? (
        <DebateFeedSkeleton />
      ) : debates.length === 0 ? (
        <EmptyState icon="forum" description="No debates in this category yet." />
      ) : (
        <div className="stack">
          {debates.map((d) => <DebateCard key={d.id} debate={d} initialMyVote={voteMap[d.id] || null} />)}
        </div>
      )}
    </div>
  );
}
