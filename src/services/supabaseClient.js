import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lxgdbzqgqpxpobgcmhpi.supabase.co";

// Publishable key — safe to expose client-side. RLS policies on every
// table are what actually enforce access control, not this key.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1kDnC57ZRVZPcnsTsIX-cg_qiTjZkG0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
