import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import DebateCard from "../components/DebateCard";
import EmptyState from "../components/EmptyState";
import { fallbackAvatar } from "../utils/formatters";

const DEBATE_SELECT = `
  id, author_id, title, description, image_url,
  comments_count, views_count, shares_count, bookmarks_count, mind_changed_count,
  is_sponsored, created_at,
  profiles:author_id ( username, avatar_url, is_verified ),
  categories:category_id ( name ),
  option_a_champion:option_a_champion_id ( username, avatar_url ),
  option_b_champion:option_b_champion_id ( username, avatar_url ),
  debate_options ( id, label, position, votes_count )
`;

const TABS = [
  { key: "debates", label: "Debates" },
  { key: "users", label: "Users" },
  { key: "categories", label: "Categories" },
];

export default function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("debates");
  const [query, setQuery] = useState("");
  const [debateResults, setDebateResults] = useState(null);
  const [voteMap, setVoteMap] = useState({});
  const [userResults, setUserResults] = useState(null);
  const [categoryResults, setCategoryResults] = useState(null);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    supabase
      .from("debates")
      .select("id, title, categories:category_id(name)")
      .eq("is_deleted", false)
      .order("trending_score", { ascending: false })
      .limit(8)
      .then(({ data }) => setTrending(data || []));
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setDebateResults(null);
      setUserResults(null);
      setCategoryResults(null);
      return;
    }

    if (tab === "debates") {
      const { data } = await supabase.from("debates").select(DEBATE_SELECT).eq("is_deleted", false).ilike("title", `%${q}%`).order("trending_score", { ascending: false }).limit(20);
      setDebateResults(data || []);
      if (data?.length) {
        const { data: votes } = await supabase.from("votes").select("debate_id, option_id").eq("user_id", user.id).in("debate_id", data.map((d) => d.id));
        const map = {};
        (votes || []).forEach((v) => (map[v.debate_id] = v.option_id));
        setVoteMap(map);
      }
    } else if (tab === "users") {
      const { data } = await supabase.from("profiles").select("id, username, avatar_url, is_verified, followers_count").ilike("username", `%${q}%`).limit(20);
      setUserResults(data || []);
    } else if (tab === "categories") {
      const { data } = await supabase.from("categories").select("id, name, icon").ilike("name", `%${q}%`).eq("is_active", true);
      setCategoryResults(data || []);
    }
  }, [query, tab, user]);

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [runSearch]);

  const showingResults = query.trim().length > 0;

  return (
    <div style={{ paddingBottom: 24 }}>
      <header className="row" style={{ margin: "16px 0 12px" }}>
        <button className="action-btn" style={{ fontSize: 20 }} onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 20 }}>Search</h2>
      </header>

      <div className="search-bar" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-elevated)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-full)", padding: "12px 16px", marginBottom: 16 }}>
        <span className="material-symbols-rounded muted">search</span>
        <input
          type="search"
          placeholder="Search debates, people, categories…"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", fontSize: 15, outline: "none", color: "var(--text)" }}
        />
      </div>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </nav>

      {!showingResults && (
        <>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Trending topics</p>
          {trending.map((d) => (
            <Link key={d.id} to={`/debate/${d.id}`} className="trending-topic" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--glass-border)", textDecoration: "none", color: "inherit" }}>
              <span>{d.title}</span>
              <span className="category-tag">{d.categories?.name}</span>
            </Link>
          ))}
        </>
      )}

      {showingResults && tab === "debates" && (
        debateResults === null ? null : debateResults.length === 0 ? (
          <EmptyState icon="search_off" description="No debates match that search." />
        ) : (
          <div className="stack">
            {debateResults.map((d) => <DebateCard key={d.id} debate={d} initialMyVote={voteMap[d.id] || null} />)}
          </div>
        )
      )}

      {showingResults && tab === "users" && (
        userResults === null ? null : userResults.length === 0 ? (
          <EmptyState icon="search_off" description="No users found." />
        ) : (
          userResults.map((p) => (
            <Link key={p.id} to={`/profile/${p.id}`} className="user-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--glass-border)", textDecoration: "none", color: "inherit" }}>
              <img className="avatar" src={p.avatar_url || fallbackAvatar(p.username)} alt="" />
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 4 }}>
                  <span className="username">{p.username}</span>
                  {p.is_verified && <span className="material-symbols-rounded verified-badge" style={{ fontSize: "15px !important" }}>verified</span>}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>{p.followers_count} followers</div>
              </div>
            </Link>
          ))
        )
      )}

      {showingResults && tab === "categories" && (
        categoryResults === null ? null : categoryResults.length === 0 ? (
          <EmptyState icon="search_off" description="No categories match that search." />
        ) : (
          categoryResults.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="trending-topic" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--glass-border)", textDecoration: "none", color: "inherit" }}>
              <span className="row"><span className="material-symbols-rounded">{cat.icon || "category"}</span> {cat.name}</span>
              <span className="material-symbols-rounded muted">chevron_right</span>
            </Link>
          ))
        )
      )}
    </div>
  );
}
