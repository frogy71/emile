import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service_role)
 * Uses REST API — works even without direct PostgreSQL access
 * Use this for server-side operations: ingestion, scoring, alerts
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
