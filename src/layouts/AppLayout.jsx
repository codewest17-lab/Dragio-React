import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import PWAInstallBanner from "../components/PWAInstallBanner";

/**
 * Wraps every authenticated screen. Header and BottomNav are declared once
 * here and never unmount as the user navigates — only <Outlet /> (the
 * current page) swaps out, so there's no navigation flicker and no full
 * page reload, matching the "instant navigation" requirement.
 */
export default function AppLayout() {
  const { user, loading } = useAuth();
  usePushNotifications(user?.id);

  if (loading) return <div className="screen centered-screen"><div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%" }} /></div>;
  if (!user) return <Navigate to="/signin" replace />;

  return (
    <div className="screen" style={{ padding: 0, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        <Outlet />
      </main>
      <BottomNav />
      <PWAInstallBanner />
    </div>
  );
}
