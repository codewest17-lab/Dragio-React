import { useEffect } from "react";
import { supabase } from "../services/supabaseClient";

// Replace with the public half of the VAPID key pair generated for this
// project (see the original README → "Web Push setup"). Not secret.
const VAPID_PUBLIC_KEY = "BFSCd9wfBVqg36r6c2k3m-EgE46bYznehWu18kkFEpgY8HlehWVIvt-xv0TjdSZbT4Ifav-SsItiKEOY8mlwgDI";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Registers the current device for Web Push, best-effort. Silently does
 * nothing if VAPID isn't configured yet, push isn't supported, or the user
 * hasn't granted permission — call it once per authenticated session (e.g.
 * from AppLayout) rather than gating any UI on it.
 */
export function usePushNotifications(userId) {
  useEffect(() => {
    if (!userId) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (VAPID_PUBLIC_KEY.startsWith("REPLACE_WITH")) return; // not configured yet

    let cancelled = false;

    (async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted" || cancelled) return;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = subscription.toJSON();
      await supabase.from("push_subscriptions").upsert(
        { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth_key: json.keys.auth },
        { onConflict: "user_id,endpoint" }
      );
    })().catch(() => {}); // best-effort — a denied permission or unsupported browser shouldn't break anything

    return () => { cancelled = true; };
  }, [userId]);
}
