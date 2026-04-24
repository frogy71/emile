import type { Metadata } from "next";
import { Mail, LifeBuoy, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | Emile",
  description: "Contacter l'équipe Emile pour toute question ou demande.",
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Contact</h1>
        <p className="mt-2 text-muted-foreground">
          Une question, un bug, un partenariat ? On te répond sous 24h ouvrées.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <Mail className="h-6 w-6" />
          <h2 className="mt-3 text-lg font-black">Support général</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Questions produit, onboarding, facturation.
          </p>
          <a
            href="mailto:contact@emile.ai"
            className="mt-3 inline-block font-bold text-primary hover:underline"
          >
            contact@emile.ai
          </a>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <LifeBuoy className="h-6 w-6" />
          <h2 className="mt-3 text-lg font-black">Données personnelles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exercer tes droits RGPD, signaler une donnée.
          </p>
          <a
            href="mailto:privacy@emile.ai"
            className="mt-3 inline-block font-bold text-primary hover:underline"
          >
            privacy@emile.ai
          </a>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a] md:col-span-2">
          <Sparkles className="h-6 w-6" />
          <h2 className="mt-3 text-lg font-black">Partenariats</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vous êtes une fédération, un réseau d&apos;associations ou un
            distributeur d&apos;outils pour le secteur non-lucratif ?
            Discutons.
          </p>
          <a
            href="mailto:partners@emile.ai"
            className="mt-3 inline-block font-bold text-primary hover:underline"
          >
            partners@emile.ai
          </a>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-muted/30 p-6 text-sm">
        <p className="font-bold">Temps de réponse moyen</p>
        <p className="mt-1 text-muted-foreground">
          Jours ouvrés : &lt;24h. Abonnés Pro : &lt;4h en priorité.
        </p>
      </div>
    </article>
  );
}
