import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

// The public half of the VAPID key pair for this project. Not secret.
const VAPID_PUBLIC_KEY = "BFSCd9wfBVqg36r6c2k3m-EgE46bYznehWu18kkFEpgY8HlehWVIvt-xv0TjdSZbT4Ifav-SsItiKEOY8mlwgDI";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Push notifications require an explicit user gesture to request
 * permission — calling Notification.requestPermission() automatically on
 * page load gets silently auto-blocked by Chrome's spam-prevention
 * heuristics (the origin ends up permanently "Blocked" in site settings,
 * with no dialog ever shown again). So this hook does NOT auto-run; it
 * exposes the current permission state and a subscribe() function meant to
 * be called from an onClick handler.
 */
export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState(null);

  const isSupported = "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
  const isConfigured = !VAPID_PUBLIC_KEY.startsWith("REPLACE_WITH");

  useEffect(() => {
    if (isSupported) setPermission(Notification.permission);
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!userId || !isSupported || !isConfigured) return;
    setError(null);

    if (Notification.permission === "denied") {
      setError("Notifications are blocked for this site. You'll need to reset the permission in your browser's site settings before enabling this.");
      return;
    }

    setSubscribing(true);
    try {
      // This MUST run inside the click handler that called subscribe() —
      // that's what makes it a genuine user gesture instead of an
      // automatic request.
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = subscription.toJSON();
      const { error: dbError } = await supabase.from("push_subscriptions").upsert(
        { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth_key: json.keys.auth },
        { onConflict: "user_id,endpoint" }
      );
      if (dbError) throw dbError;
    } catch (err) {
      setError(err.message || "Couldn't enable notifications.");
    }
    setSubscribing(false);
  }, [userId, isSupported, isConfigured]);

  return { permission, subscribe, subscribing, error, isSupported, isConfigured };
}
