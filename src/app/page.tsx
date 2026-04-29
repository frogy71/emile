"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PENDING_PROJECT_STORAGE_KEY,
  type QuickStartFormData,
} from "@/components/quick-start-form";
import { TypeformQuickStart } from "@/components/typeform-quick-start";
import {
  ArrowRight,
  Sparkles,
  Check,
  X,
  Search,
  Brain,
  KanbanSquare,
  FileText,
  AlertTriangle,
  Clock,
  TrendingDown,
  Building2,
  Landmark,
  Lightbulb,
  Factory,
} from "lucide-react";

type Provider = {
  key: "emile" | "aidesTerritoires" | "welcomeEurope" | "subventionsFr";
  name: string;
  tagline: string;
  highlight?: boolean;
  badge?: string;
  price: string;
};

type Feature = { label: string };

const PROVIDERS: Provider[] = [
  {
    key: "emile",
    name: "Emile",
    tagline: "Le copilote complet",
    highlight: true,
    badge: "Recommandé",
    price: "À partir de 0€",
  },
  {
    key: "aidesTerritoires",
    name: "Aides-Territoires",
    tagline: "Annuaire public FR",
    price: "Gratuit",
  },
  {
    key: "welcomeEurope",
    name: "WelcomeEurope",
    tagline: "Focus UE",
    price: "150–300 €/mois",
  },
  {
    key: "subventionsFr",
    name: "Subventions.fr",
    tagline: "Annuaire limité",
    price: "Gratuit (limité)",
  },
];

const FEATURES: Feature[] = [
  { label: "Couverture FR + UE + Fondations" },
  { label: "Matching IA sémantique" },
  { label: "Pipeline Kanban intégré" },
  { label: "Génération de dossiers IA" },
  { label: "Fondations privées" },
  { label: "Mises à jour quotidiennes" },
];

const PROVIDER_FEATURES: Record<Provider["key"], boolean[]> = {
  emile: [true, true, true, true, true, true],
  aidesTerritoires: [false, false, false, false, false, true],
  welcomeEurope: [false, false, false, false, false, false],
  subventionsFr: [false, false, false, false, false, false],
};

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "Emile",
      url: SITE_URL,
      description:
        "Copilote IA pour trouver et décrocher des subventions pour les ONG et associations.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "Emile — Copilote financement ONG",
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Emile",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Trouve des subventions, matching IA, génération de propositions pour les ONG et associations.",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          name: "Emile Gratuit",
          url: `${SITE_URL}/pricing`,
        },
        {
          "@type": "Offer",
          price: "79",
          priceCurrency: "EUR",
          name: "Emile Pro",
          url: `${SITE_URL}/pricing`,
        },
        {
          "@type": "Offer",
          price: "199",
          priceCurrency: "EUR",
          name: "Emile Expert",
          url: `${SITE_URL}/pricing`,
        },
      ],
    },
  ],
};

const DIFFERENTIATORS = [
  {
    icon: Search,
    tagline: "Le plus grand répertoire français de subventions.",
    body: "6 279 subventions, 33 sources publiques et privées — France, Europe, fondations. Personne d'autre n'a cette couverture.",
    color: "bg-[#c8f76f]",
  },
  {
    icon: Brain,
    tagline: "Le matching IA le plus puissant (on l'a volé à Tinder… Chut).",
    body: "Embeddings sémantiques : Emile saisit le sens de ce que vous écrivez, même avec des fautes. Plus de filtres rigides, plus de mots-clés à deviner.",
    color: "bg-[#ffe066]",
  },
  {
    icon: KanbanSquare,
    tagline: "La gestion visuelle de toutes vos subventions.",
    body: "Kanban intégré : suivi de A à Z, de la veille au dépôt. Aucun autre outil de recherche de subventions ne propose ça.",
    color: "bg-[#ffa3d1]",
  },
  {
    icon: FileText,
    tagline: "La génération de dossier en un clic.",
    body: "Brouillon structuré, adapté à chaque appel à projets. Vous gagnez des jours de rédaction, vous gardez le ton et l'expertise.",
    color: "bg-[#a3d5ff]",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "On est trois bénévoles, personne n'a le temps d'éplucher les sites de la région et des fondations. Emile m'a sorti un appel à projets de la DRAC que je n'avais jamais croisé en cinq ans d'asso. On l'a déposé la semaine dernière.",
    name: "Cécile B.",
    role: "Présidente d'une association culturelle",
    location: "Tours",
    color: "bg-[#c8f76f]",
  },
  {
    quote:
      "Avant, un dossier de demande me prenait deux jours pleins. Là je pars d'une trame déjà structurée et je peaufine. Mon dernier appel à projets, j'ai bouclé en une matinée — j'ai pu en déposer trois ce mois-ci au lieu d'un.",
    name: "Julien M.",
    role: "Chargé de mission financements, ONG santé",
    location: "Lyon",
    color: "bg-[#ffe066]",
  },
  {
    quote:
      "Je cherchais un outil qui couvre à la fois les dispositifs FEDER, les appels nationaux et les fondations privées. C'est le seul que j'ai trouvé qui consolide vraiment les trois. On a arrêté de jongler entre quatre plateformes.",
    name: "Anne-Sophie P.",
    role: "Cheffe de projet financements, communauté de communes",
    location: "Bretagne",
    color: "bg-[#a3d5ff]",
  },
  {
    quote:
      "Ce qui m'a convaincu c'est la pertinence du matching. Pas de bruit, pas de dispositifs hors-sujet — uniquement des appels où mon projet rentrait vraiment dans les critères. Ça m'évite de perdre des semaines sur des dossiers qui n'auraient jamais abouti.",
    name: "Karim H.",
    role: "Porteur de projet ESS, économie circulaire",
    location: "Marseille",
    color: "bg-[#c8f76f]",
  },
  {
    quote:
      "Je le recommande maintenant à tous mes clients en phase d'amorçage. Ça leur donne une cartographie claire de leurs financements possibles, et de mon côté je peux me concentrer sur la stratégie et la rédaction plutôt que sur la veille.",
    name: "Hélène V.",
    role: "Consultante mécénat & fundraising",
    location: "Paris",
    color: "bg-[#ffe066]",
  },
  {
    quote:
      "On gère une vingtaine de dépôts en parallèle entre l'AFD, les programmes européens et les fondations. Le Kanban a remplacé un Excel partagé qui devenait ingérable. Toute l'équipe voit où on en est sans avoir à se demander qui suit quel dossier.",
    name: "Pierre-Yves T.",
    role: "Responsable financements, association humanitaire",
    location: "Lille",
    color: "bg-[#a3d5ff]",
  },
];

function formatGrantCount(n: number): string {
  // 6 279 → "6 279" (French thousand separator: NBSP)
  return new Intl.NumberFormat("fr-FR").format(n).replace(/\s/g, " ");
}

function formatBillions(totalEur: number): string {
  // Round to one decimal billion, e.g. 4_900_000_000 → "4,9".
  if (!totalEur) return "5";
  const billions = totalEur / 1_000_000_000;
  if (billions < 1) {
    // Sub-billion: show in M€ format would change the copy, so keep a
    // floor of "1" rather than confusing the user with "0,3".
    return "1";
  }
  return billions.toFixed(1).replace(".", ",");
}

type GrantsStats = { count: number; totalAmount: number };

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GrantsStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/grants-count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.count === "number") {
          setStats({ count: data.count, totalAmount: data.totalAmount ?? 0 });
        }
      })
      .catch(() => {
        // Network failure → leave stats null and render the fallback copy.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroCount = stats ? formatGrantCount(stats.count) : "6 000+";
  const heroBillions = stats ? formatBillions(stats.totalAmount) : "5";

  const handleSubmit = async (data: QuickStartFormData) => {
    try {
      localStorage.setItem(
        PENDING_PROJECT_STORAGE_KEY,
        JSON.stringify({ ...data, savedAt: Date.now() })
      );
    } catch {
      // localStorage unavailable (private mode, quota). Signup will simply
      // not find a pending project and the user will go through normal
      // onboarding — degraded but not broken.
    }
    router.push("/signup?from=home");
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* Nav — minimal: form section is the CTA */}
      <nav className="border-b-2 border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-foreground"
          >
            Emile
            <span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-lg">
              .
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Tarifs
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="#essayer" className="hidden sm:inline-block">
              <Button variant="accent" size="sm">
                Trouver mes subventions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. HOOK */}
      <section className="mx-auto max-w-4xl px-6 pt-14 pb-12 text-center md:pt-20">
        <Badge variant="green" className="mb-6 text-sm px-3 py-1.5 font-black">
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Copilote financement ONG
        </Badge>
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-foreground md:text-7xl">
          <span className="bg-[#c8f76f] px-3 rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_#1a1a1a]">
            {heroCount}
          </span>{" "}
          subventions vous attendent.
        </h1>
        <p className="mt-6 text-lg font-bold text-foreground md:text-xl">
          Près de {heroBillions} Md€ de financements disponibles.
        </p>
        <p className="mt-2 text-base font-medium text-muted-foreground md:text-lg">
          33 sources · France · Europe · Fondations privées · Mises à jour
          quotidiennes.
        </p>
        <div className="mt-8">
          <Link href="#essayer">
            <Button variant="accent" size="lg">
              Trouver mes subventions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 1.5 POUR QUI — quick "this is for me" check */}
      <section className="border-t-2 border-border bg-card py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-5 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Emile accompagne
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Building2, label: "Associations & ONG", color: "bg-[#c8f76f]" },
              { icon: Landmark, label: "Collectivités territoriales", color: "bg-[#ffe066]" },
              { icon: Lightbulb, label: "Porteurs de projets", color: "bg-[#ffa3d1]" },
              { icon: Factory, label: "Entreprises & ESS", color: "bg-[#a3d5ff]" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 shadow-[3px_3px_0px_0px_#1a1a1a]"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border ${item.color}`}
                >
                  <item.icon className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="text-sm font-black text-foreground leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. LE PROBLÈME */}
      <section className="border-t-2 border-border bg-foreground py-16 text-background md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Badge
            variant="default"
            className="mb-5 bg-[#ffa3d1] text-foreground px-3 py-1 text-xs font-black border-2 border-background"
          >
            Le problème
          </Badge>
          <h2 className="text-4xl font-black leading-tight md:text-5xl">
            Chercher des subventions, c&apos;est un cauchemar.
          </h2>
          <p className="mt-5 text-lg font-medium text-background/80 md:text-xl">
            Des centaines de sites. Des critères incompréhensibles. Des heures
            perdues à chercher des aiguilles dans une botte de foin.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-background bg-background/5 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-background bg-[#ffa3d1]">
                <TrendingDown className="h-5 w-5 text-foreground" strokeWidth={2.5} />
              </div>
              <p className="mt-4 text-3xl font-black md:text-4xl">80 %</p>
              <p className="mt-1 text-sm font-bold text-background/80">
                des associations passent à côté de financements auxquels elles
                ont droit.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-background bg-background/5 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-background bg-[#ffe066]">
                <Clock className="h-5 w-5 text-foreground" strokeWidth={2.5} />
              </div>
              <p className="mt-4 text-3xl font-black md:text-4xl">12 h</p>
              <p className="mt-1 text-sm font-bold text-background/80">
                en moyenne par mois passées à éplucher des portails publics
                disparates.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-background bg-background/5 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-background bg-[#c8f76f]">
                <AlertTriangle
                  className="h-5 w-5 text-foreground"
                  strokeWidth={2.5}
                />
              </div>
              <p className="mt-4 text-3xl font-black md:text-4xl">∞</p>
              <p className="mt-1 text-sm font-bold text-background/80">
                deadlines manquées parce qu&apos;une alerte importante s&apos;est
                perdue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MA SOLUTION — pourquoi Emile est différent */}
      <section className="border-t-2 border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Badge
            variant="green"
            className="mb-5 px-3 py-1 text-xs font-black"
          >
            La solution
          </Badge>
          <h2 className="text-4xl font-black text-foreground md:text-5xl">
            Emile — Le seul outil qui trouve, matche, gère et rédige vos
            demandes de subvention — automatiquement.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {DIFFERENTIATORS.map((d) => (
              <div
                key={d.tagline}
                className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border ${d.color}`}
                >
                  <d.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h3 className="mt-5 text-2xl font-black leading-tight text-foreground">
                  {d.tagline}
                </h3>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  {d.body}
                </p>
              </div>
            ))}
          </div>

          {/* Card-based comparison — feels like an app store, not a spreadsheet */}
          <div className="mt-16">
            <h3 className="text-2xl font-black text-foreground md:text-3xl">
              Emile vs les alternatives
            </h3>
            <p className="mt-2 text-base text-muted-foreground font-medium">
              Comparez. Choisissez. Décrochez.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {PROVIDERS.map((p) => {
                const flags = PROVIDER_FEATURES[p.key];
                return (
                  <div
                    key={p.key}
                    className={`relative rounded-2xl border-2 bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a] ${
                      p.highlight
                        ? "border-[#7bc618] ring-4 ring-[#c8f76f]"
                        : "border-border"
                    }`}
                  >
                    {p.badge && (
                      <Badge
                        variant="default"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 text-[10px] font-black"
                      >
                        {p.badge}
                      </Badge>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black tracking-tight text-foreground">
                        {p.name}
                      </span>
                      {p.key === "emile" && (
                        <span className="rounded-md bg-foreground px-1.5 text-base text-[#c8f76f]">
                          .
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {p.tagline}
                    </p>

                    <ul className="mt-5 space-y-3">
                      {FEATURES.map((f, i) => {
                        const ok = flags[i];
                        return (
                          <li
                            key={f.label}
                            className="flex items-start gap-2.5"
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border ${
                                ok ? "bg-[#c8f76f]" : "bg-card"
                              }`}
                            >
                              {ok ? (
                                <Check
                                  className="h-3 w-3 text-foreground"
                                  strokeWidth={3.5}
                                />
                              ) : (
                                <X
                                  className="h-3 w-3 text-rose-500"
                                  strokeWidth={3.5}
                                />
                              )}
                            </span>
                            <span
                              className={`text-sm leading-tight ${
                                ok
                                  ? "font-bold text-foreground"
                                  : "font-medium text-muted-foreground"
                              }`}
                            >
                              {f.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-6 border-t-2 border-border pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Prix
                      </p>
                      <p className="mt-1 text-base font-black text-foreground">
                        {p.price}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. ESSAYER — Typeform-style step-by-step */}
      <section
        id="essayer"
        className="border-t-2 border-border bg-[#fefae0] py-16 md:py-20"
      >
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-10 text-center">
            <Badge
              variant="default"
              className="mb-5 bg-foreground text-background px-3 py-1 text-xs font-black"
            >
              Essayez maintenant
            </Badge>
            <h2 className="text-4xl font-black text-foreground md:text-5xl">
              Décrivez votre projet.
            </h2>
            <p className="mt-4 text-lg font-medium text-muted-foreground md:text-xl">
              Six questions. Quelques minutes. Notre IA croise vos réponses avec
              {" "}
              {stats ? formatGrantCount(stats.count) : "6 000+"} subventions FR
              &amp; UE.
            </p>
          </div>

          <TypeformQuickStart onSubmit={handleSubmit} />

          <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
            Aucune carte bancaire. Vos données restent privées.
          </p>
        </div>
      </section>

      {/* 5. AVIS — testimonials */}
      <section className="border-t-2 border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Badge
            variant="green"
            className="mb-5 px-3 py-1 text-xs font-black"
          >
            Ils utilisent Emile
          </Badge>
          <h2 className="text-4xl font-black text-foreground md:text-5xl">
            Des heures gagnées. Des dossiers décrochés.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border text-2xl font-black ${t.color}`}
                  aria-hidden
                >
                  &ldquo;
                </div>
                <blockquote className="mt-5 text-base font-semibold leading-relaxed text-foreground">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-5 border-t-2 border-border pt-4 text-sm">
                  <p className="font-black text-foreground">{t.name}</p>
                  <p className="font-medium text-muted-foreground">
                    {t.role}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="#essayer">
              <Button variant="default" size="lg">
                Trouver mes subventions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Emile — Copilote financement ONG.
          </p>
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            <Link href="/pricing" className="hover:text-foreground">
              Tarifs
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Connexion
            </Link>
            <Link href="/legal/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/legal/cgu" className="hover:text-foreground">
              CGU
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/legal/mentions" className="hover:text-foreground">
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
