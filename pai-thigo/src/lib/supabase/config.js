const fallbackSupabaseUrl = "https://gxrdmnjvazoxlyudczmx.supabase.co";
const fallbackSupabaseAnonKey = "sb_publishable_FL2wUOj13gYs4CQIu2ZlTw_wfvUlvmm";

function trimValue(value) {
  return String(value ?? "").trim();
}

export function resolveSupabasePublicConfig() {
  const envUrl = trimValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const envAnonKeyRaw = trimValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Mantem o runtime fixo no projeto oficial, evitando mismatch entre URL e API key.
  if (envUrl === fallbackSupabaseUrl) {
    return {
      supabaseUrl: fallbackSupabaseUrl,
      supabaseAnonKey: fallbackSupabaseAnonKey,
      usingFallback: true,
    };
  }

  const envLooksComplete = Boolean(envUrl && envAnonKeyRaw);

  if (envLooksComplete) {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envAnonKeyRaw,
      usingFallback: false,
    };
  }

  return {
    supabaseUrl: fallbackSupabaseUrl,
    supabaseAnonKey: fallbackSupabaseAnonKey,
    usingFallback: true,
  };
}
