import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient = null;
const { supabaseUrl, supabaseAnonKey } = resolveSupabasePublicConfig();

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
