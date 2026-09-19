export function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label}`;
  }
  return "now";
}

/**
 * Friendlier copy for the most common Supabase auth error messages.
 * Falls back to the raw message for anything unrecognized.
 */
export function friendlyAuthError(error) {
  const msg = error?.message || "Something went wrong. Try again.";
  const map = {
    "Invalid login credentials": "That email and password don't match. Try again.",
    "User already registered": "An account with this email already exists.",
    "Password should be at least 6 characters": "Use a password with at least 6 characters.",
    "Email not confirmed": "Confirm your email before signing in — check your inbox.",
  };
  return map[msg] || msg;
}

export function fallbackAvatar(username = "?") {
  const initial = (username || "?").charAt(0).toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="#1a2038"/><text x="18" y="24" font-size="16" fill="#fff" text-anchor="middle" font-family="sans-serif">${initial}</text></svg>`
  )}`;
}
