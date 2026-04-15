function trimValue(value) {
  return String(value ?? "").trim();
}

function looksLikeSupabaseUrl(value) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
}

function looksLikeSupabaseKey(value) {
  return value.startsWith("sb_publishable_") || value.startsWith("eyJ");
}

export function resolveSupabasePublicConfig() {
  const canonicalUrl = "https://gxrdmnjvazoxlyudczmx.supabase.co";
  const canonicalAnonKey = "sb_publishable_FL2wUOj13gYs4CQIu2ZlTw_wfvUlvmm";
  const envUrl = trimValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const envAnonKey = trimValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const validUrl = looksLikeSupabaseUrl(envUrl);
  const validAnonKey = looksLikeSupabaseKey(envAnonKey);
  const envMatchesCanonical =
    validUrl &&
    validAnonKey &&
    envUrl === canonicalUrl &&
    envAnonKey === canonicalAnonKey;

  return {
    supabaseUrl: envMatchesCanonical ? envUrl : canonicalUrl,
    supabaseAnonKey: envMatchesCanonical ? envAnonKey : canonicalAnonKey,
    usingFallback: !envMatchesCanonical,
    envHasMismatch: !envMatchesCanonical,
  };
}
