// Decodes a JWT's `exp` claim (seconds since epoch) into a ms-epoch timestamp.
// Used to know exactly when a stored access token goes stale, rather than
// hardcoding an assumed lifetime.
export function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    const payload = JSON.parse(json);

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
