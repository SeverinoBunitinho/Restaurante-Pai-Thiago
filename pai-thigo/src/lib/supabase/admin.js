import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { resolveSupabasePublicConfig } from "@/lib/supabase/config";

const { supabaseUrl } = resolveSupabasePublicConfig();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseAdminConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export const getSupabaseAdminClient = cache(function getSupabaseAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
});
