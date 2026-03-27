import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth
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

    // If user already has an org, skip onboarding
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: org } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (org) {
        redirect("/dashboard");
      }
    }
  }

  return <>{children}</>;
}
