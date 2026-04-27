import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotatingWord } from "@/components/rotating-word";
import {
  Search,
  Target,
  FileText,
  ArrowRight,
  Bell,
  BarChart3,
  Sparkles,
  Check,
  X,
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
    emile: { icon: null, text: "5 700+ FR + UE + Fondations" },
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
    label: "Alertes intelligentes",
    emile: { icon: "check", text: "Basées sur le score de matching" },
    aidesTerritoires: { icon: "check", text: "Basiques" },
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
    emile: { icon: null, text: "Gratuit pour commencer" },
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
          price: "79",
          priceCurrency: "EUR",
          name: "Emile Pro — Mensuel",
          url: `${SITE_URL}/pricing`,
        },
        {
          "@type": "Offer",
          price: "59",
          priceCurrency: "EUR",
          name: "Emile Pro — Annuel (par mois)",
          url: `${SITE_URL}/pricing`,
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* Nav */}
      <nav className="border-b-2 border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-2xl font-black tracking-tight text-foreground">
            Emile<span className="text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg ml-1 text-lg">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm">
                Tarifs
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="accent" size="sm">
                Essai gratuit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <Badge variant="green" className="mb-6 text-sm px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Votre copilote financement
          </Badge>
          <h1 className="text-6xl font-black leading-[1.1] tracking-tight text-foreground">
            Emile trouve vos{" "}
            <span className="bg-[#c8f76f] px-2 rounded-xl border-2 border-border shadow-[3px_3px_0px_0px_#1a1a1a]">
              subventions.
            </span>{" "}
            Vous gardez l&apos;impact.
          </h1>
          <p className="mt-6 text-xl text-muted-foreground font-medium max-w-xl">
            Le copilote IA pour les <RotatingWord />
            <br className="mt-2" />
            Emile surveille, classe et vous aide à décrocher vos financements.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button variant="default" size="lg">
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg">
                Comment ça marche
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm font-bold text-muted-foreground">
            Gratuit · aucune carte · ~2 800 appels à projets FR + UE indexés
          </p>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t-2 border-border py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-black text-foreground">
            Track. Match. Win.
          </h2>
          <p className="mt-2 text-lg text-muted-foreground font-medium">
            Trois étapes. Zéro prise de tête.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Track */}
            <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-7 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-card">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-black">Track</h3>
              <p className="mt-2 text-sm font-semibold">
                Surveillance automatique des appels à projets français et
                européens. Alertes avant les deadlines. Résumés IA.
              </p>
            </div>

            {/* Match */}
            <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-7 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-card">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-black">Match</h3>
              <p className="mt-2 text-sm font-semibold">
                Score de compatibilité entre votre profil et chaque
                subvention. Classement par pertinence. Explication claire.
              </p>
            </div>

            {/* Win */}
            <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-7 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-card">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-black">Win</h3>
              <p className="mt-2 text-sm font-semibold">
                Générez un brouillon de proposition structuré et adapté au
                bailleur. En quelques minutes, pas en semaines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t-2 border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-black text-foreground">
            Moins d&apos;admin, plus d&apos;impact.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bell,
                title: "Ne ratez plus de deadline",
                desc: "Alertes automatiques quand une subvention pertinente approche de sa date limite.",
                color: "bg-[#ffe066]",
              },
              {
                icon: BarChart3,
                title: "Priorisez intelligemment",
                desc: "GrantScore analyse la compatibilité entre votre profil et chaque opportunité.",
                color: "bg-[#c8f76f]",
              },
              {
                icon: FileText,
                title: "Rédigez plus vite",
                desc: "Un brouillon structuré en quelques minutes, sans consultant coûteux.",
                color: "bg-[#ffa3d1]",
              },
              {
                icon: Search,
                title: "Fini les dizaines de portails",
                desc: "Toutes les subventions France + UE agrégées sur une seule plateforme.",
                color: "bg-[#a3d5ff]",
              },
              {
                icon: Target,
                title: "Comprenez votre éligibilité",
                desc: "Explication claire de pourquoi une subvention vous correspond — ou non.",
                color: "bg-[#d4b5ff]",
              },
              {
                icon: Sparkles,
                title: "IA au service de l'impact",
                desc: "L'IA qui travaille pour vous, pas contre vous. Transparente et explicable.",
                color: "bg-[#ffe066]",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border ${item.color}`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t-2 border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-black text-foreground">
            Pourquoi Emile&nbsp;?
          </h2>
          <p className="mt-2 text-lg text-muted-foreground font-medium">
            Comparez. Choisissez. Décrochez.
          </p>

          <div className="mt-14 overflow-x-auto rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a]">
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

          <div className="mt-10 flex justify-center">
            <Link href="/signup">
              <Button variant="default" size="lg">
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="border-t-2 border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-black text-foreground text-center">
            Commencez gratuitement.
          </h2>
          <p className="mt-3 text-center text-muted-foreground font-medium max-w-2xl mx-auto">
            Matching IA illimité et 1 brouillon de proposition gratuit —
            suffisant pour tester Emile de bout en bout avant de passer Pro.
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Prix HT — TVA non applicable pour les associations (article 261-7-1° du CGI)
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black">Découverte</h3>
                <Badge variant="secondary">Gratuit</Badge>
              </div>
              <p className="mt-4">
                <span className="text-5xl font-black">0€</span>
                <span className="text-muted-foreground font-bold"> / pour toujours</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Matching illimité + 1 brouillon IA. Aucune carte requise.
              </p>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="mt-6 w-full">
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-8 shadow-[6px_6px_0px_0px_#1a1a1a] relative">
              <Badge variant="default" className="absolute -top-3 right-4 bg-foreground text-background px-3 py-1 text-xs font-black">
                Le + populaire
              </Badge>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black">Pro</h3>
                <Badge variant="green">Illimité</Badge>
              </div>
              <p className="mt-4">
                <span className="text-5xl font-black">79€</span>
                <span className="font-bold">/mois HT</span>
              </p>
              <p className="mt-1 text-sm font-bold">
                ou <span>59€/mois</span> en annuel (708€/an)
              </p>
              <Link href="/signup?plan=monthly">
                <Button variant="default" size="lg" className="mt-6 w-full">
                  <Sparkles className="h-4 w-4" />
                  Démarrer l&apos;essai Pro
                </Button>
              </Link>
              <p className="mt-2 text-center text-[11px] font-bold text-foreground/70">
                Essai sans carte · annulable à tout moment
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <p className="font-black text-center mb-4">Inclus dans les deux plans :</p>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  "~2 800 subventions FR + UE",
                  "Matching IA illimité (GrantScore)",
                  "Alertes email personnalisées",
                  "Projets illimités",
                  "Filtres par type, territoire, thématique",
                  "Score de difficulté par grant",
                  "Mise à jour quotidienne des sources",
                  "Export .docx + édition en ligne",
                ].map((f) => (
                  <span key={f} className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="h-4 w-4 text-[#c8f76f] shrink-0" />
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-sm font-bold text-foreground/80 hover:text-foreground underline underline-offset-4"
                >
                  Voir tous les détails et la FAQ
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Emile — Copilote financement ONG.</p>
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            <Link href="/pricing" className="hover:text-foreground">Tarifs</Link>
            <Link href="/login" className="hover:text-foreground">Connexion</Link>
            <Link href="/legal/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/legal/cgu" className="hover:text-foreground">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link href="/legal/mentions" className="hover:text-foreground">Mentions légales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
