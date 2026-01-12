/**
 * Minimal JWT helpers (no signature verification client-side).
 * We use exp to decide if user must re-login.
 */

// PUBLIC_INTERFACE
export function decodeJwtPayload(token) {
  /** Decode JWT payload into JSON (best-effort). */
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function isJwtExpired(token) {
  /** Return true if token has exp and is expired (or token is invalid). */
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}
