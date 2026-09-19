import { useNavigate } from "react-router-dom";

export default function PageStub({ title }) {
  const navigate = useNavigate();
  return (
    <div className="stack" style={{ paddingTop: 20 }}>
      <button className="action-btn" style={{ fontSize: 20, width: "fit-content" }} onClick={() => navigate(-1)}>
        <span className="material-symbols-rounded">arrow_back</span>
      </button>
      <div className="empty-state">
        <span className="material-symbols-rounded" style={{ fontSize: 32 }}>construction</span>
        <h3 style={{ marginTop: 12 }}>{title}</h3>
        <p style={{ marginTop: 4 }}>This page is being migrated to React next — not built yet in this pass.</p>
      </div>
    </div>
  );
}
