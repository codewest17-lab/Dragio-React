import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useChat(peerId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState(null);
  const [areFriends, setAreFriends] = useState(null); // null = checking, then true/false
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const typingTimeoutRef = useRef(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const markRead = useCallback(async () => {
    if (!readReceiptsEnabled || !user) return;
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", peerId).eq("receiver_id", user.id).is("read_at", null);
  }, [peerId, user, readReceiptsEnabled]);

  useEffect(() => {
    if (!user || !peerId) return;
    let cancelled = false;

    (async () => {
      const { data: myProfile } = await supabase.from("profiles").select("read_receipts_enabled").eq("id", user.id).single();
      if (!cancelled) setReadReceiptsEnabled(myProfile?.read_receipts_enabled ?? true);

      const { data: friendsResult } = await supabase.rpc("are_friends", { a: user.id, b: peerId });
      if (cancelled) return;
      setAreFriends(Boolean(friendsResult));
      if (!friendsResult) return;

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(200);

      if (!cancelled) setMessages(data || []);
    })();

    return () => { cancelled = true; };
  }, [user, peerId]);

  useEffect(() => {
    if (areFriends) markRead();
  }, [areFriends, markRead]);

  useEffect(() => {
    if (!user || !peerId || !areFriends) return;

    const channel = supabase
      .channel(`chat:${[user.id, peerId].sort().join(":")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new;
        if (m.sender_id === user.id) return; // rendered optimistically already
        if (!(m.sender_id === peerId && m.receiver_id === user.id)) return;
        setMessages((prev) => [...(prev || []), m]);
        setPeerTyping(false);
        markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new;
        const isThisThread = (m.sender_id === user.id && m.receiver_id === peerId) || (m.sender_id === peerId && m.receiver_id === user.id);
        if (!isThisThread) return;
        setMessages((prev) => (prev || []).map((existing) => (existing.id === m.id ? m : existing)));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, peerId, areFriends, markRead]);

  useEffect(() => {
    if (!user || !peerId || !areFriends) return;

    const typingChannel = supabase.channel(`typing:${[user.id, peerId].sort().join(":")}`);
    typingChannelRef.current = typingChannel;

    typingChannel
      .on("broadcast", { event: "typing" }, (msg) => {
        if (msg.payload.from !== peerId) return;
        setPeerTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 3000);
      })
      .subscribe();

    return () => supabase.removeChannel(typingChannel);
  }, [user, peerId, areFriends]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: user.id } });
  }

  async function sendMessage(content) {
    const { data, error } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: peerId, content }).select("*").single();
    if (error || !data) throw error || new Error("Send failed");
    setMessages((prev) => [...(prev || []), data]);
    return data;
  }

  async function editMessage(messageId, content) {
    const { data, error } = await supabase.from("messages").update({ content, edited_at: new Date().toISOString() }).eq("id", messageId).select("*").single();
    if (error || !data) throw error || new Error("Edit failed");
    setMessages((prev) => (prev || []).map((m) => (m.id === messageId ? data : m)));
  }

  async function deleteMessage(messageId) {
    const { error } = await supabase.from("messages").update({ is_deleted: true, content: "" }).eq("id", messageId);
    if (error) throw error;
    setMessages((prev) => (prev || []).map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: "" } : m)));
  }

  return {
    messages, areFriends, peerTyping, readReceiptsEnabled,
    sendMessage, editMessage, deleteMessage, notifyTyping,
  };
}
