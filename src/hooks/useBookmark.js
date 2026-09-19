import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useBookmark(debateId) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!user || !debateId) return;
    let cancelled = false;
    supabase
      .from("bookmarks")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("debate_id", debateId)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsBookmarked(Boolean(data)); });
    return () => { cancelled = true; };
  }, [user, debateId]);

  const toggle = useCallback(async () => {
    if (!user) return;
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("debate_id", debateId);
      setIsBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, debate_id: debateId });
      setIsBookmarked(true);
    }
  }, [user, debateId, isBookmarked]);

  return { isBookmarked, toggle };
}
