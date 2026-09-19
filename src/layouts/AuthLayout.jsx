import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps sign-in/sign-up/onboarding/password screens. If the user is already
 * authenticated, bounce them straight to the app instead of showing auth
 * forms again.
 */
export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return <Outlet />;
}
