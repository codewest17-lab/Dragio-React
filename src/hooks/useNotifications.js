import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(null);
  const [actionStatus, setActionStatus] = useState({ friendRequests: new Map(), collabInvites: new Map() });

  const loadActionStatuses = useCallback(async (list) => {
    const friendSenderIds = list.filter((n) => n.type === "friend_request" && n.actor).map((n) => n.actor.id);
    const collabDebateIds = list.filter((n) => n.type === "collab_invite" && n.debate_id).map((n) => n.debate_id);

    const friendRequests = new Map();
    const collabInvites = new Map();

    if (friendSenderIds.length > 0) {
      const { data } = await supabase.from("friend_requests").select("id, sender_id, status, created_at").eq("receiver_id", user.id).in("sender_id", friendSenderIds).order("created_at", { ascending: false });
      (data || []).forEach((row) => { if (!friendRequests.has(row.sender_id)) friendRequests.set(row.sender_id, row); });
    }

    if (collabDebateIds.length > 0) {
      const { data } = await supabase.from("debate_collab_invites").select("id, debate_id, status, created_at").eq("invitee_id", user.id).in("debate_id", collabDebateIds).order("created_at", { ascending: false });
      (data || []).forEach((row) => { if (!collabInvites.has(row.debate_id)) collabInvites.set(row.debate_id, row); });
    }

    return { friendRequests, collabInvites };
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, is_read, created_at, debate_id, comment_id, actor:actor_id ( id, username )")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const list = data || [];
    setNotifications(list);
    if (list.length) setActionStatus(await loadActionStatuses(list));
  }, [user, loadActionStatuses]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, load]);

  async function markRead(id) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function respondFriendRequest(requestId, accept) {
    const { error } = await supabase.rpc("respond_to_friend_request", { p_request_id: requestId, p_accept: accept });
    if (error) throw error;
    await load();
  }

  async function respondCollabInvite(inviteId, accept) {
    const { error } = await supabase.rpc("respond_to_collab_invite", { p_invite_id: inviteId, p_accept: accept });
    if (error) throw error;
    await load();
  }

  return { notifications, actionStatus, markRead, markAllRead, respondFriendRequest, respondCollabInvite };
}
