import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useFollow(authorId) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isSelf = user?.id === authorId;

  useEffect(() => {
    if (!user || !authorId || isSelf) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", authorId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setIsFollowing(Boolean(data));
          setLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, [user, authorId, isSelf]);

  const toggle = useCallback(async () => {
    if (!user || isSelf) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", authorId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: authorId });
      setIsFollowing(true);
    }
  }, [user, authorId, isFollowing, isSelf]);

  return { isFollowing, toggle, loaded, isSelf };
}
