import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

const DEBATE_DETAIL_SELECT = `
  *,
  profiles:author_id ( username, avatar_url, is_verified ),
  categories:category_id ( name ),
  option_a_champion:option_a_champion_id ( username, avatar_url ),
  option_b_champion:option_b_champion_id ( username, avatar_url ),
  debate_options ( id, label, position, votes_count )
`;

export function useDebateDetail(debateId) {
  const { user } = useAuth();
  const [debate, setDebate] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [replyContext, setReplyContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!debateId || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase.from("debates").select(DEBATE_DETAIL_SELECT).eq("id", debateId).single();
      if (error || !data) {
        if (!cancelled) { setNotFound(true); setLoading(false); }
        return;
      }

      const { data: voteRow } = await supabase.from("votes").select("option_id").eq("debate_id", debateId).eq("user_id", user.id).maybeSingle();

      if (data.in_response_to_comment_id) {
        const { data: comment } = await supabase
          .from("comments")
          .select("content, debate_id, profiles:author_id ( username ), debates:debate_id ( title )")
          .eq("id", data.in_response_to_comment_id)
          .maybeSingle();
        if (comment && !cancelled) setReplyContext(comment);
      }

      // Best-effort view bump — fire and forget
      supabase.from("debates").update({ views_count: data.views_count + 1 }).eq("id", debateId).then(() => {});

      if (!cancelled) {
        setDebate(data);
        setMyVote(voteRow?.option_id || null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [debateId, user]);

  return { debate, myVote, replyContext, loading, notFound };
}
