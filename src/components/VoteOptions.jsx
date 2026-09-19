import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { fallbackAvatar } from "../utils/formatters";

/**
 * Renders however many options a debate has (2–6). Percentages stay hidden
 * until the viewer casts their own vote — that's enforced here, not just at
 * initial render, so a live vote-count update never leaks results early.
 */
export default function VoteOptions({ debateId, options, initialMyVote, championFor }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myVote, setMyVote] = useState(initialMyVote);
  const [voting, setVoting] = useState(false);

  const sorted = [...options].sort((a, b) => a.position - b.position);
  const total = sorted.reduce((sum, o) => sum + o.votes_count, 0);
  const hasVoted = Boolean(myVote);

  async function castVote(optionId) {
    if (hasVoted || voting) return;
    if (!user) return navigate("/signin");

    setVoting(true);
    const { error } = await supabase.from("votes").insert({ debate_id: debateId, user_id: user.id, option_id: optionId });
    setVoting(false);

    if (!error) setMyVote(optionId);
  }

  return (
    <div className="vote-options">
      {sorted.map((option, i) => {
        const champion = championFor?.(option.position);
        const pct = total ? Math.round((option.votes_count / total) * 100) : 0;
        const voted = option.id === myVote;

        return (
          <button
            key={option.id}
            className={`vote-option option-${i % 2 === 0 ? "a" : "b"} ${voted ? "voted" : ""}`}
            disabled={hasVoted}
            onClick={() => castVote(option.id)}
          >
            <div className="fill" style={{ width: `${hasVoted ? pct : 0}%` }} />
            <div className="label-row">
              <span className="row" style={{ gap: 6 }}>
                {champion && (
                  <img className="avatar" style={{ width: 18, height: 18 }} src={champion.avatar_url || fallbackAvatar(champion.username)} alt="" />
                )}
                {option.label}
              </span>
              <span className="vote-pct" style={{ display: hasVoted ? "inline" : "none" }}>{pct}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
