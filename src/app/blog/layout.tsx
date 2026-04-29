import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b-2 border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Emile
            <span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-lg">
              .
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm font-semibold hover:underline"
            >
              Blog
            </Link>
            <Link href="/pricing" className="text-sm font-semibold hover:underline">
              Tarifs
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="accent" size="sm">
                Essayer
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {children}

      <footer className="border-t-2 border-border mt-24">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Emile. Tous droits réservés.</span>
          <div className="flex gap-4">
            <Link href="/legal/mentions" className="hover:underline">
              Mentions
            </Link>
            <Link href="/legal/cgu" className="hover:underline">
              CGU
            </Link>
            <Link href="/legal/privacy" className="hover:underline">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
