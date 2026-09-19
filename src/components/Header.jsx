import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="spread" style={{ padding: "20px 20px 0", marginBottom: 20 }}>
      <div className="brand-mark" style={{ fontSize: 24 }}>Dragio</div>
      <div className="row" style={{ gap: 16 }}>
        <Link to="/messages" className="action-btn">
          <span className="material-symbols-rounded">chat</span>
        </Link>
        <Link to="/search" className="action-btn">
          <span className="material-symbols-rounded">search</span>
        </Link>
        <Link to="/notifications" className="action-btn">
          <span className="material-symbols-rounded">notifications</span>
        </Link>
      </div>
    </header>
  );
}
