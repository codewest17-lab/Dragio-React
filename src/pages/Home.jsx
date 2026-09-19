import { useState } from "react";
import { useFeed } from "../hooks/useFeed";
import DebateCard from "../components/DebateCard";
import { DebateFeedSkeleton } from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";

const TABS = [
  { key: "trending", label: "Trending" },
  { key: "latest", label: "Latest" },
  { key: "following", label: "Following" },
  { key: "bookmarks", label: "Bookmarks" },
  { key: "categories", label: "Categories" },
];

const EMPTY_COPY = {
  trending: ["forum", "No debates yet", "Be the first to start one."],
  latest: ["schedule", "Nothing posted yet", "Check back soon."],
  following: ["group", "Follow people to see their debates here", "Find debaters worth following in Search."],
  bookmarks: ["bookmark", "No bookmarks yet", "Save debates to revisit them later."],
  categories: ["category", "No debates in your interests yet", "Try Trending instead, or update your interests."],
};

export default function Home() {
  const [tab, setTab] = useState("trending");
  const { debates, voteMap, loading } = useFeed(tab);

  return (
    <div style={{ paddingBottom: 24 }}>
      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <DebateFeedSkeleton />
      ) : debates.length === 0 ? (
        <EmptyState icon={EMPTY_COPY[tab][0]} title={EMPTY_COPY[tab][1]} description={EMPTY_COPY[tab][2]} />
      ) : (
        <div className="stack">
          {debates.map((debate) => (
            <DebateCard key={debate.id} debate={debate} initialMyVote={voteMap[debate.id] || null} />
          ))}
        </div>
      )}
    </div>
  );
}
