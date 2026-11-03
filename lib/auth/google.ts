interface GoogleAuthorizationOptions {
  clientId?: string;
  redirectUri?: string;
  origin: string;
  nonce: string;
}

export function buildGoogleAuthorizationUrl({ clientId, redirectUri, origin, nonce }: GoogleAuthorizationOptions): string {
  const configuredClient = clientId?.trim();
  if (!configuredClient || !/^[\w-]+\.apps\.googleusercontent\.com$/.test(configuredClient)) {
    throw new Error("Configura GOOGLE_CLIENT_ID o NEXT_PUBLIC_GOOGLE_CLIENT_ID con el cliente OAuth web de Google.");
  }

  // Preserve the registered spelling, including a possible trailing slash.
  const callback = redirectUri?.trim() || new URL(origin).origin;
  const parsedCallback = new URL(callback);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsedCallback.hostname);
  if ((parsedCallback.protocol !== "https:" && !(local && parsedCallback.protocol === "http:")) || parsedCallback.hash || parsedCallback.username || parsedCallback.password) {
    throw new Error("GOOGLE_REDIRECT_URI debe ser una URL HTTPS, o HTTP en localhost, sin fragmentos ni credenciales.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: configuredClient,
    redirect_uri: callback,
    response_type: "token id_token",
    scope: "email profile openid",
    prompt: "select_account",
    nonce,
  }).toString();
  return url.toString();
}
