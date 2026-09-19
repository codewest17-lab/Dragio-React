import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

/**
 * Each DebateCard/DebateDetail subscribes to its OWN realtime channel for
 * its own debate_id — self-contained, no manual DOM lookups or parent
 * state-threading needed (unlike the vanilla version's
 * `querySelector('[data-debate-id=...]')` pattern).
 */
export function useDebateRealtime(debateId, initialOptions, initialCounts) {
  const [options, setOptions] = useState(initialOptions || []);
  const [counts, setCounts] = useState(initialCounts || {});

  // Keep in sync if the parent list re-fetches and passes fresh initial data
  useEffect(() => setOptions(initialOptions || []), [initialOptions]);
  useEffect(() => setCounts(initialCounts || {}), [initialCounts]);

  useEffect(() => {
    if (!debateId) return;

    const channel = supabase
      .channel(`debate-live:${debateId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "debates", filter: `id=eq.${debateId}` },
        (payload) => {
          setCounts({
            comments_count: payload.new.comments_count,
            views_count: payload.new.views_count,
            bookmarks_count: payload.new.bookmarks_count,
            mind_changed_count: payload.new.mind_changed_count,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "debate_options", filter: `debate_id=eq.${debateId}` },
        async () => {
          const { data } = await supabase.from("debate_options").select("id, label, position, votes_count").eq("debate_id", debateId);
          if (data) setOptions(data);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [debateId]);

  return { options, counts, setOptions, setCounts };
}
