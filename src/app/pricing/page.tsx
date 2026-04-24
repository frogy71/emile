import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarifs — 79€/mois pour trouver vos subventions",
  description:
    "Emile Pro : 79€ HT/mois (59€ HT en annuel). Matching IA illimité sur 2 000+ subventions FR + EU, propositions générées, alertes deadline. Essai gratuit.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Tarifs Emile — 79€/mois pour trouver vos subventions",
    description:
      "Matching IA illimité, propositions générées, alertes deadline. Essai gratuit, sans carte.",
    url: "/pricing",
    type: "website",
  },
};

/**
 * /pricing — public pricing page.
 *
 * Two tiers only. We intentionally avoid a "freemium + metered upgrade"
 * ladder because NGOs hate surprise charges. Free = try it end-to-end once,
 * Pro = unlimited.
 */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
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
                Essayer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b-2 border-border bg-[#c8f76f]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Tarifs simples, sans surprise
          </Badge>
          <h1 className="text-5xl font-black text-foreground leading-tight">
            Un prix.
            <br />
            Toutes les subventions.
          </h1>
          <p className="mt-6 text-lg font-medium text-foreground/80 max-w-2xl mx-auto">
            Le prix d&apos;une journée de consultant par mois pour un copilote
            qui bosse tous les jours. Associations loi 1901 : TVA non applicable.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl border-2 border-border bg-card p-8 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black">Découverte</h2>
              <Badge variant="secondary">Gratuit</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Pour tester Emile de bout en bout sur un dossier.
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">0 €</span>
              <span className="text-sm font-bold text-muted-foreground">
                / pour toujours
              </span>
            </div>
            <Link href="/signup" className="mt-6 block">
              <Button variant="outline" className="w-full">
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <ul className="mt-8 space-y-3">
              <Feature>Accès aux ~2 800 subventions actives</Feature>
              <Feature>Matching IA illimité sur tes projets</Feature>
              <Feature>Alertes deadline hebdomadaires</Feature>
              <Feature>
                <strong>1 brouillon de proposition IA</strong> (à vie)
              </Feature>
              <Feature>Export .docx + édition en ligne</Feature>
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl border-2 border-border bg-[#ffe066] p-8 shadow-[6px_6px_0px_0px_#1a1a1a]">
            <div className="absolute -top-3 right-6 rounded-full border-2 border-border bg-foreground px-3 py-1 text-xs font-black text-background">
              Le + populaire
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black">Pro</h2>
              <Badge variant="green">
                <Zap className="h-3 w-3 mr-1" />
                Illimité
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground/80">
              Pour les associations qui répondent régulièrement à des appels.
            </p>

            <div className="mt-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">79 €</span>
                <span className="text-sm font-bold text-foreground/70">
                  / mois HT
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-foreground/60">
                ou{" "}
                <span className="font-bold">59 €/mois</span> en annuel
                (708 €/an)
              </p>
            </div>

            <Link href="/signup?plan=monthly" className="mt-6 block">
              <Button variant="default" className="w-full">
                <Sparkles className="h-4 w-4" />
                Démarrer l&apos;essai Pro
              </Button>
            </Link>
            <p className="mt-2 text-center text-[11px] font-bold text-foreground/70">
              Essai sans carte · annulable à tout moment
            </p>

            <ul className="mt-8 space-y-3">
              <Feature strong>Tout du plan Découverte, plus :</Feature>
              <Feature>
                <strong>Propositions IA illimitées</strong> (Sonnet 4)
              </Feature>
              <Feature>Alertes quotidiennes possibles</Feature>
              <Feature>Historique complet des matches</Feature>
              <Feature>Support prioritaire par email</Feature>
              <Feature>
                Accès anticipé aux nouvelles sources de subventions
              </Feature>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-center">Questions fréquentes</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Faq
              q="Les associations paient-elles la TVA ?"
              a="Non. Les associations loi 1901 sont exonérées de TVA (art. 261-7-1° CGI). Le montant affiché est le prix final."
            />
            <Faq
              q="Puis-je annuler à tout moment ?"
              a="Oui. Annulation en un clic depuis les paramètres, aucun engagement. L'abonnement reste actif jusqu'à la fin de la période payée."
            />
            <Faq
              q="Les brouillons IA sont-ils utilisables tel quel ?"
              a="Non, et c'est volontaire. Les passages [À COMPLÉTER] en orange attendent ta relecture. Emile structure et pré-rédige ; tu gardes la voix et les détails précis."
            />
            <Faq
              q="D'où viennent les subventions ?"
              a="Aides-Territoires, FDVA, FDF, EU Funding & Tenders, ~30 fondations françaises. Mis à jour quotidiennement, cron automatique."
            />
            <Faq
              q="Mes données sont-elles privées ?"
              a="Oui. Rien n'est partagé avec d'autres utilisateurs. Les prompts envoyés à Claude (Anthropic) ne servent pas à entraîner de modèle."
            />
            <Faq
              q="Y a-t-il un tarif association à budget réduit ?"
              a="Oui — écris-nous à francois@tresorier.co, on regarde au cas par cas pour les structures à moins de 50k€ de budget annuel."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl border-2 border-border bg-[#a3d5ff] p-8 text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
          <h2 className="text-2xl font-black">Pas encore convaincu ?</h2>
          <p className="mt-2 text-sm font-medium">
            Teste le plan Découverte — 5 minutes pour comprendre si Emile fait le
            job pour toi.
          </p>
          <Link href="/signup" className="inline-block mt-4">
            <Button variant="default">
              Essayer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
          <p>© {new Date().getFullYear()} Emile — Copilote financement ONG.</p>
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            <Link href="/" className="hover:text-foreground">Accueil</Link>
            <Link href="/legal/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/legal/cgu" className="hover:text-foreground">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link href="/legal/mentions" className="hover:text-foreground">Mentions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  children,
  strong,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <li className="flex items-start gap-2 text-sm font-medium">
      <Check className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
      <span className={strong ? "font-bold" : ""}>{children}</span>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[3px_3px_0px_0px_#1a1a1a]">
      <h3 className="text-sm font-black">{q}</h3>
      <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">
        {a}
      </p>
    </div>
  );
}
