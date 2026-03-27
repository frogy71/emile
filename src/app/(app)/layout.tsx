import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Settings,
  LogOut,
  Plus,
  Search,
  FileText,
  Shield,
} from "lucide-react";

const PROJECT_COLORS = [
  "bg-[#c8f76f]",
  "bg-[#a3d5ff]",
  "bg-[#ffe066]",
  "bg-[#ffa3d1]",
  "bg-[#d4b5ff]",
];

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            href="/dashboard"
            className="text-2xl font-black tracking-tight text-foreground"
          >
            Emile<span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-lg">.</span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="px-3 pt-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#c8f76f]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/grants"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#ffe066]"
          >
            <Search className="h-4 w-4" />
            Subventions
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#a3d5ff]"
          >
            <Building2 className="h-4 w-4" />
            Mon organisation
          </Link>
          <Link
            href="/proposals"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#d4b5ff]"
          >
            <FileText className="h-4 w-4" />
            Propositions
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#ffa3d1]"
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Link>
        </nav>

        {/* Admin link (only visible, access controlled in page) */}
        <div className="px-3 mt-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        </div>

        {/* Projects section */}
        <div className="mt-6 flex-1 overflow-y-auto px-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Mes projets
            </span>
            <Link
              href="/projects/new"
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-[#c8f76f] text-foreground transition-all hover:shadow-sm hover:translate-y-[-1px]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </Link>
          </div>

          <div className="space-y-1">
            {projects.length > 0 ? (
              projects.map((project, i) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary group"
                >
                  <div
                    className={`h-3 w-3 rounded-md border border-border ${PROJECT_COLORS[i % PROJECT_COLORS.length]} shrink-0`}
                  />
                  <span className="truncate">{project.name}</span>
                  <FolderOpen className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </Link>
              ))
            ) : (
              <p className="px-3 text-xs text-muted-foreground font-medium">
                Aucun projet
              </p>
            )}
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border p-3">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-[#ffa3d1] hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-72 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
