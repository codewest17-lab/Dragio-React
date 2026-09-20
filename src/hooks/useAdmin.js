import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useAdminGate() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null); // null = checking

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type").eq("id", user.id).single().then(({ data }) => {
      setIsAdmin(data?.account_type === "admin");
    });
  }, [user]);

  return isAdmin;
}

export function useAdminStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    supabase.rpc("admin_get_stats").single().then(({ data }) => setStats(data));
  }, []);

  return stats;
}
