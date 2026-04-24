"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Shield,
  X,
} from "lucide-react";

const PROJECT_COLORS = [
  "bg-[#c8f76f]",
  "bg-[#a3d5ff]",
  "bg-[#ffe066]",
  "bg-[#ffa3d1]",
  "bg-[#d4b5ff]",
];

/**
 * AppShell — responsive app chrome.
 *
 * Wraps the sidebar + main area and owns the mobile open/close state. On lg+
 * the sidebar is always visible (matching the previous desktop layout). Below
 * lg, the sidebar slides in from the left over a backdrop, triggered by a
 * hamburger in the top bar.
 *
 * The parent layout is a server component — it does auth + projects fetch,
 * then hands the data and children down here as props.
 */
export function AppShell({
  children,
  projects,
}: {
  children: React.ReactNode;
  projects: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes — otherwise clicking a link
  // keeps the overlay open on top of the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc closes the drawer on mobile.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar — only < lg */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b-2 border-border bg-card px-4">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-[#c8f76f] shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1a1a1a]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/dashboard"
          className="text-xl font-black tracking-tight text-foreground"
        >
          Emile
          <span className="text-[#c8f76f] bg-foreground px-1.5 py-0.5 rounded-md ml-1 text-sm">
            .
          </span>
        </Link>
        <div className="w-10" />
      </div>

      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-border bg-card transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo + close (mobile) */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link
            href="/dashboard"
            className="text-2xl font-black tracking-tight text-foreground"
          >
            Emile
            <span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-lg">
              .
            </span>
          </Link>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-border bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="px-3 pt-4 space-y-1">
          <NavLink
            href="/dashboard"
            icon={LayoutDashboard}
            activeClass="bg-[#c8f76f]"
            hoverClass="hover:bg-[#c8f76f]"
            pathname={pathname}
          >
            Dashboard
          </NavLink>
          <NavLink
            href="/grants"
            icon={Search}
            activeClass="bg-[#ffe066]"
            hoverClass="hover:bg-[#ffe066]"
            pathname={pathname}
          >
            Subventions
          </NavLink>
          <NavLink
            href="/profile"
            icon={Building2}
            activeClass="bg-[#a3d5ff]"
            hoverClass="hover:bg-[#a3d5ff]"
            pathname={pathname}
          >
            Mon organisation
          </NavLink>
          <NavLink
            href="/proposals"
            icon={FileText}
            activeClass="bg-[#d4b5ff]"
            hoverClass="hover:bg-[#d4b5ff]"
            pathname={pathname}
          >
            Propositions
          </NavLink>
          <NavLink
            href="/settings"
            icon={Settings}
            activeClass="bg-[#ffa3d1]"
            hoverClass="hover:bg-[#ffa3d1]"
            pathname={pathname}
          >
            Paramètres
          </NavLink>
        </nav>

        {/* Admin (access controlled in page) */}
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
                    className={`h-3 w-3 rounded-md border border-border ${
                      PROJECT_COLORS[i % PROJECT_COLORS.length]
                    } shrink-0`}
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

      {/* Main content — add top padding on mobile to clear the fixed top bar */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  activeClass,
  hoverClass,
  pathname,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  hoverClass: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground transition-colors ${
        active ? activeClass : hoverClass
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
