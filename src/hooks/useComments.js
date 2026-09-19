import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

const COMMENT_SELECT = "*, profiles:author_id ( username, avatar_url, is_verified )";

export function useComments(debateId) {
  const { user } = useAuth();
  const [sortMode, setSortMode] = useState("newest");
  const [topLevel, setTopLevel] = useState([]);
  const [repliesByParent, setRepliesByParent] = useState({});
  const [replyDebatesByComment, setReplyDebatesByComment] = useState({});
  const [likedIds, setLikedIds] = useState(new Set());
  const [mindChangedCommentId, setMindChangedCommentId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!debateId || !user) return;
    setLoading(true);

    const orderColumn = { newest: "created_at", top: "likes_count", controversial: "replies_count" }[sortMode];

    const { data: top } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("debate_id", debateId)
      .is("parent_comment_id", null)
      .eq("is_deleted", false)
      .order(orderColumn, { ascending: false });

    const { data: replies } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("debate_id", debateId)
      .not("parent_comment_id", "is", null)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    const byParent = {};
    (replies || []).forEach((r) => { (byParent[r.parent_comment_id] ||= []).push(r); });

    const allIds = [...(top || []).map((c) => c.id), ...(replies || []).map((r) => r.id)];
    let replyDebateMap = {};
    if (allIds.length) {
      const { data: replyDebates } = await supabase.from("debates").select("id, title, in_response_to_comment_id").in("in_response_to_comment_id", allIds).eq("is_deleted", false);
      (replyDebates || []).forEach((d) => { (replyDebateMap[d.in_response_to_comment_id] ||= []).push(d); });
    }

    const { data: likes } = await supabase.from("comment_likes").select("comment_id").eq("user_id", user.id);
    const { data: mc } = await supabase.from("mind_changed").select("comment_id").eq("debate_id", debateId).eq("user_id", user.id).maybeSingle();

    setTopLevel(top || []);
    setRepliesByParent(byParent);
    setReplyDebatesByComment(replyDebateMap);
    setLikedIds(new Set((likes || []).map((l) => l.comment_id)));
    setMindChangedCommentId(mc?.comment_id || null);
    setLoading(false);
  }, [debateId, user, sortMode]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!debateId || !user) return;
    const channel = supabase
      .channel(`comments:${debateId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `debate_id=eq.${debateId}` }, (payload) => {
        if (payload.new.author_id === user.id) return; // already handled optimistically on submit
        load();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [debateId, user, load]);

  async function postComment(content, parentCommentId = null) {
    const { error } = await supabase.from("comments").insert({ debate_id: debateId, author_id: user.id, parent_comment_id: parentCommentId, content });
    if (error) throw error;
    await load();
  }

  async function toggleLike(commentId) {
    const alreadyLiked = likedIds.has(commentId);
    if (alreadyLiked) {
      await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", commentId);
    } else {
      await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });
    }
    setLikedIds((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    await load();
  }

  async function markMindChanged(commentId) {
    if (mindChangedCommentId) return;
    const { error } = await supabase.from("mind_changed").insert({ debate_id: debateId, comment_id: commentId, user_id: user.id });
    if (error) return;
    setMindChangedCommentId(commentId);
  }

  return {
    sortMode, setSortMode, topLevel, repliesByParent, replyDebatesByComment,
    likedIds, mindChangedCommentId, loading, postComment, toggleLike, markMindChanged,
  };
}
