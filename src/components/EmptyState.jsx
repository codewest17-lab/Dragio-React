export default function EmptyState({ icon = "info", title, description }) {
  return (
    <div className="empty-state">
      <span className="material-symbols-rounded" style={{ fontSize: 32 }}>{icon}</span>
      {title && <h3 style={{ marginTop: 12 }}>{title}</h3>}
      {description && <p style={{ marginTop: 4 }}>{description}</p>}
    </div>
  );
}
