import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";

// Placeholder projects — will come from DB
const PLACEHOLDER_PROJECTS = [
  {
    id: "proj-1",
    name: "Aide humanitaire Ukraine",
    color: "bg-[#c8f76f]",
  },
  {
    id: "proj-2",
    name: "Inclusion jeunesse",
    color: "bg-[#a3d5ff]",
  },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-border bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center border-b-2 border-border px-6">
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
            href="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#ffe066]"
          >
            <Building2 className="h-4 w-4" />
            Mon organisation
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-[#d4b5ff]"
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Link>
        </nav>

        {/* Projects section */}
        <div className="mt-6 flex-1 overflow-y-auto px-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Mes projets
            </span>
            <Link
              href="/projects/new"
              className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-border bg-[#c8f76f] text-foreground transition-all hover:shadow-[2px_2px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </Link>
          </div>

          <div className="space-y-1">
            {PLACEHOLDER_PROJECTS.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary group"
              >
                <div
                  className={`h-3 w-3 rounded-md border-2 border-border ${project.color} shrink-0`}
                />
                <span className="truncate">{project.name}</span>
                <FolderOpen className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t-2 border-border p-3">
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
