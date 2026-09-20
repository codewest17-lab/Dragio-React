import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useBusinessDashboard() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [totals, setTotals] = useState({ votes: 0, comments: 0, views: 0, shares: 0 });
  const [myDebates, setMyDebates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: businessData } = await supabase.from("business_profiles").select("*").eq("id", user.id).maybeSingle();
    setBusiness(businessData);

    if (businessData) {
      const { data: debates } = await supabase
        .from("debates")
        .select("id, title, total_votes_count, comments_count, views_count, shares_count")
        .eq("author_id", user.id)
        .eq("is_deleted", false);

      const t = (debates || []).reduce(
        (acc, d) => {
          acc.votes += d.total_votes_count;
          acc.comments += d.comments_count;
          acc.views += d.views_count;
          acc.shares += d.shares_count;
          return acc;
        },
        { votes: 0, comments: 0, views: 0, shares: 0 }
      );
      setTotals(t);
      setMyDebates(debates || []);

      const { data: campaignData } = await supabase
        .from("sponsored_campaigns")
        .select("id, budget_cents, is_active, impressions, clicks, debates:debate_id ( title )")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false });
      setCampaigns(campaignData || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function createBusiness({ businessName, websiteUrl }) {
    await supabase.from("profiles").update({ account_type: "business" }).eq("id", user.id);
    const { error } = await supabase.from("business_profiles").insert({
      id: user.id,
      business_name: businessName,
      website_url: websiteUrl || null,
    });
    if (error) throw error;
    await load();
  }

  async function createCampaign({ debateId, budgetUsd, days }) {
    const startsAt = new Date();
    const endsAt = new Date(Date.now() + days * 86400000);

    // Inserted as pending (is_active: false) — nothing is charged. Flip
    // is_active to true only after a real payment integration confirms a
    // successful charge; that write must come from a trusted server path
    // since prevent_campaign_tampering blocks direct client updates to it.
    const { error } = await supabase.from("sponsored_campaigns").insert({
      debate_id: debateId,
      business_id: user.id,
      budget_cents: Math.round(budgetUsd * 100),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_active: false,
    });
    if (error) throw error;
    await load();
  }

  return { business, totals, myDebates, campaigns, loading, createBusiness, createCampaign };
}
