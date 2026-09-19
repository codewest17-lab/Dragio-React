import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

/**
 * Tracks the current user as "online" for as long as this hook is mounted,
 * and exposes a way to check whether another specific user is online too.
 * One shared channel name ("online-users") means presence state is
 * consistent across any page that uses this hook.
 */
export function usePresence(userId) {
  const channelRef = useRef(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel("online-users", { config: { presence: { key: userId } } });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => forceRender((n) => n + 1))
      .on("presence", { event: "join" }, () => forceRender((n) => n + 1))
      .on("presence", { event: "leave" }, () => forceRender((n) => n + 1))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const isOnline = useCallback((otherId) => {
    if (!channelRef.current || otherId === userId) return otherId === userId;
    const state = channelRef.current.presenceState();
    return Boolean(state[otherId]?.length);
  }, [userId]);

  return { isOnline };
}
