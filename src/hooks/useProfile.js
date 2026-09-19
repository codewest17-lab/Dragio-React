import { useEffect, useState } from "react";
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

export function useProfile(profileId) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ votes: 0, comments: 0, views: 0 });
  const [debates, setDebates] = useState([]);
  const [voteMap, setVoteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const targetId = profileId || user?.id;
    if (!targetId || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", targetId).single();
      if (error || !profileData) {
        if (!cancelled) { setNotFound(true); setLoading(false); }
        return;
      }

      const { data: debatesData } = await supabase
        .from("debates")
        .select(DEBATE_SELECT + ", total_votes_count")
        .eq("author_id", targetId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      const totals = (debatesData || []).reduce(
        (acc, d) => {
          acc.votes += d.total_votes_count;
          acc.comments += d.comments_count;
          acc.views += d.views_count;
          return acc;
        },
        { votes: 0, comments: 0, views: 0 }
      );

      let map = {};
      if (debatesData?.length) {
        const { data: votes } = await supabase.from("votes").select("debate_id, option_id").eq("user_id", user.id).in("debate_id", debatesData.map((d) => d.id));
        (votes || []).forEach((v) => (map[v.debate_id] = v.option_id));
      }

      if (!cancelled) {
        setProfile(profileData);
        setStats(totals);
        setDebates(debatesData || []);
        setVoteMap(map);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profileId, user]);

  return { profile, stats, debates, voteMap, loading, notFound, isOwnProfile: (profileId || user?.id) === user?.id };
}
