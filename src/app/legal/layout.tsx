import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
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
          <div className="flex items-center gap-3">
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

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex gap-6 flex-wrap mb-10 text-sm font-semibold">
          <Link href="/legal/mentions" className="hover:underline">
            Mentions légales
          </Link>
          <Link href="/legal/cgu" className="hover:underline">
            CGU
          </Link>
          <Link href="/legal/privacy" className="hover:underline">
            Politique de confidentialité
          </Link>
          <Link href="/legal/contact" className="hover:underline">
            Contact
          </Link>
        </div>
        <div className="prose-legal">{children}</div>
      </div>

      <footer className="border-t-2 border-border mt-24">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Emile. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
