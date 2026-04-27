import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Sparkles, Zap, Crown } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarifs — À partir de 0€ pour trouver vos subventions",
  description:
    "Emile : Gratuit pour commencer, Pro à 79€/mois, Expert à 199€/mois. Matching IA, génération de dossiers, alertes intelligentes. Essai gratuit, sans carte.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Tarifs Emile — À partir de 0€",
    description:
      "Trois plans pour trouver vos subventions : Gratuit, Pro (79€/mois), Expert (199€/mois). Matching IA, génération de dossiers, alertes.",
    url: "/pricing",
    type: "website",
  },
};

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
            Trois plans.
            <br />
            Toutes les subventions.
          </h1>
          <p className="mt-6 text-lg font-medium text-foreground/80 max-w-2xl mx-auto">
            Commencez gratuitement, passez Pro quand vous répondez régulièrement,
            choisissez Expert pour la puissance maximale. Associations loi 1901 :
            TVA non applicable.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Gratuit */}
          <div className="rounded-3xl border-2 border-border bg-card p-8 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black">Gratuit</h2>
              <Badge variant="secondary">Découverte</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Pour découvrir Emile et tester ses recommandations.
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
              <Feature>3 matchings par mois</Feature>
              <Feature>Top 5 résultats par matching</Feature>
              <Feature>Catalogue de subventions (consultation)</Feature>
              <Feature>Alertes email basiques</Feature>
              <Feature muted>Pas de génération de dossier IA</Feature>
            </ul>
          </div>

          {/* Pro — highlighted */}
          <div className="relative rounded-3xl border-4 border-foreground bg-[#ffe066] p-8 shadow-[8px_8px_0px_0px_#1a1a1a] md:-mt-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-border bg-foreground px-3 py-1 text-xs font-black text-background whitespace-nowrap">
              Le plus populaire
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

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">79 €</span>
              <span className="text-sm font-bold text-foreground/70">
                / mois HT
              </span>
            </div>

            <Link href="/signup?plan=pro" className="mt-6 block">
              <Button variant="default" className="w-full">
                <Sparkles className="h-4 w-4" />
                Démarrer l&apos;essai Pro
              </Button>
            </Link>
            <p className="mt-2 text-center text-[11px] font-bold text-foreground/70">
              Essai sans carte · annulable à tout moment
            </p>

            <ul className="mt-8 space-y-3">
              <Feature strong>Tout du plan Gratuit, plus :</Feature>
              <Feature>
                <strong>Matchings illimités</strong>
              </Feature>
              <Feature>Top 50 résultats</Feature>
              <Feature>
                <strong>5 dossiers IA générés</strong> par mois
              </Feature>
              <Feature>Alertes intelligentes (basées sur score)</Feature>
              <Feature>
                Feedback learning (le matching s&apos;améliore)
              </Feature>
              <Feature>Export DOCX des dossiers</Feature>
              <Feature>Support email</Feature>
            </ul>
          </div>

          {/* Expert */}
          <div className="rounded-3xl border-2 border-border bg-[#a3d5ff] p-8 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black">Expert</h2>
              <Badge variant="default">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground/80">
              Pour les structures qui en font une activité quotidienne.
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">199 €</span>
              <span className="text-sm font-bold text-foreground/70">
                / mois HT
              </span>
            </div>

            <Link href="/signup?plan=expert" className="mt-6 block">
              <Button variant="outline" className="w-full">
                <Crown className="h-4 w-4" />
                Choisir Expert
              </Button>
            </Link>
            <p className="mt-2 text-center text-[11px] font-bold text-foreground/70">
              Essai sans carte · annulable à tout moment
            </p>

            <ul className="mt-8 space-y-3">
              <Feature strong>Tout du plan Pro, plus :</Feature>
              <Feature>
                <strong>Tout illimité</strong>
              </Feature>
              <Feature>
                <strong>Dossiers IA illimités</strong>
              </Feature>
              <Feature>Accès prioritaire aux nouvelles subventions</Feature>
              <Feature>Dashboard analytics avancé</Feature>
              <Feature>Support prioritaire</Feature>
              <Feature>Multi-projets illimité</Feature>
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
              q="Quelle différence entre Pro et Expert ?"
              a="Pro couvre la grande majorité des associations : matchings illimités et 5 dossiers IA par mois. Expert lève toutes les limites et ajoute un dashboard analytics et un support prioritaire — pour les structures qui répondent à plusieurs appels par semaine."
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
              q="Y a-t-il un tarif association à budget réduit ?"
              a="Oui — écris-nous à francois@tresorier.co, on regarde au cas par cas pour les structures à moins de 50k€ de budget annuel."
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl border-2 border-border bg-[#a3d5ff] p-8 text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
          <h2 className="text-2xl font-black">Pas encore convaincu ?</h2>
          <p className="mt-2 text-sm font-medium">
            Démarre avec le plan Gratuit — 3 matchings par mois, sans carte.
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
  muted,
}: {
  children: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <li className="flex items-start gap-2 text-sm font-medium">
      <Check
        className={`h-4 w-4 mt-0.5 shrink-0 ${
          muted ? "text-muted-foreground/40" : "text-foreground"
        }`}
      />
      <span
        className={
          strong
            ? "font-bold"
            : muted
              ? "text-muted-foreground"
              : ""
        }
      >
        {children}
      </span>
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
