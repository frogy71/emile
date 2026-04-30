"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Mail,
  Image as ImageIcon,
  FileText,
  Receipt,
} from "lucide-react";

/**
 * Admin layout — single tabbed surface for everything operational.
 *
 * The sidebar (in app-shell) only links to /admin. From there, every
 * sub-area is reachable via the tabs rendered here so the admin doesn't
 * have to bounce between sidebar entries and page links.
 */

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/sources", label: "Sources & Grants", icon: Database },
  { href: "/admin/email-sequences", label: "Emails", icon: Mail },
  { href: "/admin/carousels", label: "Carousels", icon: ImageIcon },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/invoices", label: "Factures", icon: Receipt },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-2">
          {TABS.map((tab) => {
            const { href, label, icon: Icon } = tab;
            const exact = "exact" in tab && tab.exact === true;
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl border-2 px-3 py-2 text-sm font-black transition-all ${
                  active
                    ? "border-border bg-foreground text-background shadow-[3px_3px_0px_0px_#1a1a1a]"
                    : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
