"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  QuickStartForm,
  PENDING_PROJECT_STORAGE_KEY,
  type QuickStartFormData,
} from "@/components/quick-start-form";
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

type CellIcon = "check" | "cross" | null;
type ComparisonCell = { icon: CellIcon; text: string };
type ComparisonRow = {
  label: string;
  emile: ComparisonCell;
  aidesTerritoires: ComparisonCell;
  welcomeEurope: ComparisonCell;
  subventionsFr: ComparisonCell;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Subventions indexées",
    emile: { icon: null, text: "6 279 FR + UE + Fondations" },
    aidesTerritoires: { icon: null, text: "~4 000 (publiques FR)" },
    welcomeEurope: { icon: null, text: "UE uniquement" },
    subventionsFr: { icon: null, text: "~2 000" },
  },
  {
    label: "Matching IA personnalisé",
    emile: { icon: "check", text: "Embeddings sémantiques + feedback" },
    aidesTerritoires: { icon: "cross", text: "Filtres manuels" },
    welcomeEurope: { icon: "cross", text: "Filtres manuels" },
    subventionsFr: { icon: "cross", text: "Filtres manuels" },
  },
  {
    label: "Pipeline visuel (Kanban)",
    emile: { icon: "check", text: "Suivi de candidatures complet" },
    aidesTerritoires: { icon: "cross", text: "—" },
    welcomeEurope: { icon: "cross", text: "—" },
    subventionsFr: { icon: "cross", text: "—" },
  },
  {
    label: "Génération de dossiers IA",
    emile: { icon: "check", text: "Brouillon complet auto-généré" },
    aidesTerritoires: { icon: "cross", text: "—" },
    welcomeEurope: { icon: "cross", text: "—" },
    subventionsFr: { icon: "cross", text: "—" },
  },
  {
    label: "Fondations privées",
    emile: { icon: "check", text: "200+ portails crawlés" },
    aidesTerritoires: { icon: "cross", text: "—" },
    welcomeEurope: { icon: "cross", text: "—" },
    subventionsFr: { icon: "cross", text: "—" },
  },
  {
    label: "Sources européennes",
    emile: { icon: "check", text: "SEDIA + Erasmus+ + Interreg + EEA" },
    aidesTerritoires: { icon: "cross", text: "—" },
    welcomeEurope: { icon: "check", text: "Couverture UE" },
    subventionsFr: { icon: "cross", text: "Limité" },
  },
  {
    label: "Apprentissage continu",
    emile: { icon: "check", text: "S'améliore à chaque interaction" },
    aidesTerritoires: { icon: "cross", text: "—" },
    welcomeEurope: { icon: "cross", text: "—" },
    subventionsFr: { icon: "cross", text: "—" },
  },
  {
    label: "Prix",
    emile: { icon: null, text: "À partir de 0€" },
    aidesTerritoires: { icon: null, text: "Gratuit" },
    welcomeEurope: { icon: null, text: "150–300 €/mois" },
    subventionsFr: { icon: null, text: "Gratuit (limité)" },
  },
];

function ComparisonCellContent({
  cell,
  highlight = false,
}: {
  cell: ComparisonCell;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {cell.icon === "check" && (
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md border-2 border-border ${
            highlight ? "bg-card" : "bg-[#c8f76f]"
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
      {cell.icon === "cross" && (
        <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-border bg-card">
          <X className="h-4 w-4 text-rose-500" strokeWidth={3} />
        </span>
      )}
      <span
        className={`text-xs leading-snug ${
          cell.icon === "cross"
            ? "font-medium text-muted-foreground"
            : "font-semibold"
        }`}
      >
        {cell.text}
      </span>
    </div>
  );
}

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
    title: "Le plus grand répertoire francophone et européen",
    body: "6 279 subventions, 33 sources publiques et privées — France, Europe, fondations. Personne d'autre n'a cette couverture.",
    color: "bg-[#c8f76f]",
  },
  {
    icon: Brain,
    title: "Un matching IA qui comprend votre projet",
    body: "Embeddings sémantiques : Emile saisit le sens de ce que vous écrivez, même avec des fautes. Plus de filtres rigides, plus de mots-clés à deviner.",
    color: "bg-[#ffe066]",
  },
  {
    icon: KanbanSquare,
    title: "Un pipeline visuel pour gérer vos candidatures",
    body: "Kanban intégré : suivi de A à Z, de la veille au dépôt. Aucun autre outil de recherche de subventions ne propose ça.",
    color: "bg-[#ffa3d1]",
  },
  {
    icon: FileText,
    title: "Des dossiers générés par IA en un clic",
    body: "Brouillon structuré, adapté à chaque appel à projets. Vous gagnez des jours de rédaction, vous gardez le ton et l'expertise.",
    color: "bg-[#a3d5ff]",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "En 10 minutes j'ai trouvé 3 subventions que je ne connaissais pas. C'est la première fois qu'un outil me fait gagner du temps au lieu d'en perdre.",
    name: "Marie D.",
    role: "Directrice d'une association culturelle",
    color: "bg-[#c8f76f]",
  },
  {
    quote:
      "Le dossier généré par l'IA m'a fait gagner une semaine de travail. Je l'ai juste relu et complété — la structure était déjà là.",
    name: "Thomas R.",
    role: "Chargé de mission ESS",
    color: "bg-[#ffe066]",
  },
  {
    quote:
      "Le Kanban a transformé notre suivi. On voit d'un coup d'œil ce qui est déposé, ce qui attend, ce qu'on a décroché.",
    name: "Sophie L.",
    role: "Coordinatrice ONG environnement",
    color: "bg-[#a3d5ff]",
  },
];

export default function LandingPage() {
  const router = useRouter();

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
            6 000+
          </span>{" "}
          subventions vous attendent.
        </h1>
        <p className="mt-6 text-lg font-bold text-foreground md:text-xl">
          Près de 5 Md€ de financements disponibles.
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
            Emile combine ce que personne d&apos;autre ne fait.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground font-medium md:text-xl">
            Le plus grand répertoire, le matching le plus précis, la gestion
            visuelle, et la génération de dossiers — en un seul outil.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {DIFFERENTIATORS.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border ${d.color}`}
                >
                  <d.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h3 className="mt-5 text-xl font-black leading-tight">
                  {d.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {d.body}
                </p>
              </div>
            ))}
          </div>

          {/* Comparison table — hammers the differentiation */}
          <div className="mt-16">
            <h3 className="text-2xl font-black text-foreground md:text-3xl">
              Emile vs les alternatives
            </h3>
            <p className="mt-2 text-base text-muted-foreground font-medium">
              Comparez. Choisissez. Décrochez.
            </p>

            <div className="mt-8 overflow-x-auto rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a]">
              <table className="w-full min-w-[820px] border-collapse">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16.66%]" />
                  <col className="w-[16.66%]" />
                  <col className="w-[16.66%]" />
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="p-5 text-left text-xs font-black uppercase tracking-wide align-bottom">
                      Critère
                    </th>
                    <th className="relative p-5 text-center align-bottom bg-[#c8f76f] border-x-2 border-border">
                      <Badge
                        variant="default"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 text-[10px] font-black"
                      >
                        Recommandé
                      </Badge>
                      <span className="inline-flex items-baseline text-xl font-black tracking-tight">
                        Emile
                        <span className="ml-1 rounded-md bg-foreground px-1.5 py-0 text-base text-[#c8f76f]">
                          .
                        </span>
                      </span>
                    </th>
                    <th className="p-5 text-center text-sm font-black align-bottom">
                      Aides-Territoires
                    </th>
                    <th className="p-5 text-center text-sm font-black align-bottom">
                      WelcomeEurope
                    </th>
                    <th className="p-5 text-center text-sm font-black align-bottom">
                      Subventions.fr
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, idx) => {
                    const isLast = idx === COMPARISON_ROWS.length - 1;
                    return (
                      <tr
                        key={row.label}
                        className={isLast ? "" : "border-b-2 border-border"}
                      >
                        <td className="p-5 text-sm font-bold align-top">
                          {row.label}
                        </td>
                        <td className="p-5 align-top text-center bg-[#c8f76f] border-x-2 border-border">
                          <ComparisonCellContent cell={row.emile} highlight />
                        </td>
                        <td className="p-5 align-top text-center">
                          <ComparisonCellContent cell={row.aidesTerritoires} />
                        </td>
                        <td className="p-5 align-top text-center">
                          <ComparisonCellContent cell={row.welcomeEurope} />
                        </td>
                        <td className="p-5 align-top text-center">
                          <ComparisonCellContent cell={row.subventionsFr} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-muted-foreground font-medium md:hidden">
              Faites glisser horizontalement pour comparer →
            </p>
          </div>
        </div>
      </section>

      {/* 4. ESSAYER — the form */}
      <section
        id="essayer"
        className="border-t-2 border-border bg-[#fefae0] py-16 md:py-20"
      >
        <div className="mx-auto max-w-3xl px-6">
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
              Six champs. Quelques phrases. Notre IA croise votre description
              avec 6 279 subventions FR &amp; UE.
            </p>
          </div>

          <QuickStartForm
            ctaLabel="Trouver mes subventions"
            loadingLabel="Préparation..."
            onSubmit={handleSubmit}
          />

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
                  <p className="font-medium text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-8 text-xs font-medium text-muted-foreground">
            * Témoignages illustratifs. Premiers utilisateurs en cours
            d&apos;onboarding.
          </p>

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
