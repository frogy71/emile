import { createClient } from "@supabase/supabase-js";

/**
 * Shared admin auth helper. Mirrors the inline checks in /api/admin/* —
 * verifies a Bearer token belongs to one of the hard-coded admin emails.
 * Centralised so /admin/email-sequences API routes stay short.
 */

export const ADMIN_EMAILS = [
  "francois@tresorier.co",
  "tresorier.francois@gmail.com",
];

export interface AdminUser {
  id: string;
  email: string;
}

export async function requireAdmin(
  request: Request
): Promise<{ user: AdminUser } | { error: string; status: number }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }
  const token = authHeader.split("Bearer ")[1];
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { error: "Forbidden", status: 403 };
  }
  return { user: { id: user.id, email: user.email! } };
}
