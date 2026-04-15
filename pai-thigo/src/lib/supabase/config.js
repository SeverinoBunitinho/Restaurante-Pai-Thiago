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
  const envUrl = trimValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const envAnonKey = trimValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const validUrl = looksLikeSupabaseUrl(envUrl);
  const validAnonKey = looksLikeSupabaseKey(envAnonKey);

  return {
    supabaseUrl: validUrl ? envUrl : "",
    supabaseAnonKey: validAnonKey ? envAnonKey : "",
    usingFallback: false,
    envHasMismatch: false,
  };
}
