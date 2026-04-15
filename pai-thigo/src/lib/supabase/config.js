const fallbackSupabaseUrl = "https://gxrdmnjvazoxlyudczmx.supabase.co";
const fallbackSupabaseAnonKey = "sb_publishable_FL2wUOj13gYs4CQIu2ZlTw_wfvUlvmm";

function trimValue(value) {
  return String(value ?? "").trim();
}

export function resolveSupabasePublicConfig() {
  const envUrl = trimValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const envAnonKey = trimValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const envLooksComplete = Boolean(envUrl && envAnonKey);
  const envMatchesExpectedProject = envUrl === fallbackSupabaseUrl;

  if (envLooksComplete && envMatchesExpectedProject) {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envAnonKey,
      usingFallback: false,
    };
  }

  return {
    supabaseUrl: fallbackSupabaseUrl,
    supabaseAnonKey: fallbackSupabaseAnonKey,
    usingFallback: true,
  };
}

