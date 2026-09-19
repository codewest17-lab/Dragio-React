import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

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

const PAGE_SIZE = 10;

export function useFeed(tab) {
  const { user } = useAuth();
  const [debates, setDebates] = useState([]);
  const [voteMap, setVoteMap] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let data = [];
    const from = 0;
    const to = PAGE_SIZE - 1;

    if (tab === "trending") {
      const res = await supabase.from("debates").select(DEBATE_SELECT).eq("is_deleted", false).order("trending_score", { ascending: false }).range(from, to);
      data = res.data || [];
    } else if (tab === "latest") {
      const res = await supabase.from("debates").select(DEBATE_SELECT).eq("is_deleted", false).order("created_at", { ascending: false }).range(from, to);
      data = res.data || [];
    } else if (tab === "following") {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const authorIds = (follows || []).map((f) => f.following_id);
      if (authorIds.length) {
        const res = await supabase.from("debates").select(DEBATE_SELECT).eq("is_deleted", false).in("author_id", authorIds).order("created_at", { ascending: false }).range(from, to);
        data = res.data || [];
      }
    } else if (tab === "bookmarks") {
      const res = await supabase.from("bookmarks").select(`debates:debate_id ( ${DEBATE_SELECT} )`).eq("user_id", user.id).range(from, to);
      data = (res.data || []).map((row) => row.debates).filter(Boolean);
    } else if (tab === "categories") {
      const { data: interests } = await supabase.from("user_interests").select("category_id").eq("user_id", user.id);
      const categoryIds = (interests || []).map((i) => i.category_id);
      if (categoryIds.length) {
        const res = await supabase.from("debates").select(DEBATE_SELECT).eq("is_deleted", false).in("category_id", categoryIds).order("trending_score", { ascending: false }).range(from, to);
        data = res.data || [];
      }
    }

    setDebates(data);

    if (data.length) {
      const { data: votes } = await supabase.from("votes").select("debate_id, option_id").eq("user_id", user.id).in("debate_id", data.map((d) => d.id));
      const map = {};
      (votes || []).forEach((v) => (map[v.debate_id] = v.option_id));
      setVoteMap(map);
    } else {
      setVoteMap({});
    }

    setLoading(false);
  }, [tab, user]);

  useEffect(() => { load(); }, [load]);

  // Live-insert new debates at the top of the Latest tab only — the one tab
  // where "newest first" gives an unambiguous insertion point.
  useEffect(() => {
    if (tab !== "latest" || !user) return;

    const channel = supabase
      .channel("public:debates:latest")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "debates" }, async (payload) => {
        if (payload.new.is_deleted) return;
        const { data: fullRow } = await supabase.from("debates").select(DEBATE_SELECT).eq("id", payload.new.id).single();
        if (fullRow) setDebates((prev) => [fullRow, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tab, user]);

  return { debates, voteMap, loading };
}
