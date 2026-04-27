import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { HelpAssistant } from "@/components/help-assistant";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/ui/toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let projects: { id: string; name: string }[] = [];

  // Skip auth check if Supabase is not configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // Check if user has an organization — if not, redirect to onboarding
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceCheck = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: org } = await serviceCheck
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!org) {
        redirect("/onboarding");
      }
    }

    // Fetch projects with service role (bypasses RLS)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data } = await serviceClient
        .from("projects")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(10);
      projects = data || [];
    }
  }

  return (
    <ToastProvider>
      <AppShell projects={projects}>{children}</AppShell>
      {/* Floating contextual help — renders on every authenticated page */}
      <HelpAssistant />
    </ToastProvider>
  );
}
