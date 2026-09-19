import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

/**
 * Tracks the friend-request relationship between the current user and
 * `otherId`: none / pending-sent / pending-received / accepted / declined.
 */
export function useFriendRequest(otherId) {
  const { user } = useAuth();
  const [state, setState] = useState(null); // { row, direction, status } | null
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user || !otherId || user.id === otherId) { setLoaded(true); return; }

    const { data } = await supabase
      .from("friend_requests")
      .select("id, sender_id, receiver_id, status")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const row = data[0];
      setState({ row, direction: row.sender_id === user.id ? "sent" : "received", status: row.status });
    } else {
      setState(null);
    }
    setLoaded(true);
  }, [user, otherId]);

  useEffect(() => { load(); }, [load]);

  async function sendRequest() {
    if (!user) return;
    await supabase.from("friend_requests").insert({ sender_id: user.id, receiver_id: otherId });
    await load();
  }

  async function respond(accept) {
    if (!state) return;
    await supabase.rpc("respond_to_friend_request", { p_request_id: state.row.id, p_accept: accept });
    await load();
  }

  return { state, loaded, sendRequest, respond, isSelf: user?.id === otherId };
}
