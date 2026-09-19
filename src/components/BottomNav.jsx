import { NavLink } from "react-router-dom";
import { useNotifBadge } from "../hooks/useNotifBadge";

const NAV_ITEMS = [
  { to: "/home", icon: "home", label: "Home" },
  { to: "/search", icon: "search", label: "Search" },
  { to: "/create-debate", icon: "add_circle", label: "Create" },
  { to: "/notifications", icon: "notifications", label: "Alerts", badge: true },
  { to: "/profile", icon: "person", label: "Profile" },
];

export default function BottomNav() {
  const hasUnread = useNotifBadge();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="material-symbols-rounded">{item.icon}</span>
          {item.badge && hasUnread && (
            <span className="notif-dot notif-badge" style={{ display: "block", top: "-2px", right: "6px" }} />
          )}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
