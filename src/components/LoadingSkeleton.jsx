export function DebateCardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 20, width: "80%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 60, width: "100%", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 44, width: "100%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 44, width: "100%" }} />
    </div>
  );
}

export function DebateFeedSkeleton({ count = 3 }) {
  return (
    <div className="stack">
      {Array.from({ length: count }).map((_, i) => (
        <DebateCardSkeleton key={i} />
      ))}
    </div>
  );
}
