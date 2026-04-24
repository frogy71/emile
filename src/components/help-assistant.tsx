"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  X,
  Sparkles,
  Mail,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

/**
 * HelpAssistant — a floating contextual guide that appears on every app page.
 *
 * The component picks a guide based on the current pathname and surfaces:
 *  - 1 short "what this page is for" intro
 *  - 2-3 bullet tips tailored to the page
 *  - 1-2 quick-action links so the user can jump to the next logical step
 *  - a universal footer with a mailto fallback for deeper questions
 *
 * Design choice: static content keyed on pathname rather than an AI chat. An
 * always-on assistant has to be fast and accurate; a curated tip-set beats a
 * hallucinated answer and ships today.
 */

type Guide = {
  title: string;
  intro: string;
  tips: string[];
  actions?: { label: string; href: string; icon?: LucideIcon }[];
};

function matchGuide(pathname: string): Guide {
  // Order matters — most specific paths first.
  if (pathname.startsWith("/projects/new")) {
    return {
      title: "Créer un projet en 2 minutes",
      intro:
        "Le cadre logique structure ton projet pour matcher précisément les subventions.",
      tips: [
        "Utilise le Smart-Fill en haut de la page : colle un paragraphe et l'IA remplit le reste.",
        "Les thématiques et zones géographiques sont cruciales — elles filtrent les subventions.",
        "Budget et durée optionnels mais très utiles — ils écartent les appels inadaptés.",
      ],
    };
  }
  if (pathname.match(/^\/projects\/[^/]+\/edit/)) {
    return {
      title: "Modifier et affiner",
      intro:
        "Modifie n'importe quel champ, puis relance le matching pour voir de nouvelles opportunités.",
      tips: [
        "'Enregistrer & relancer la recherche' réanalyse les ~2 800 subventions avec les nouvelles infos.",
        "Ajouter des thématiques ou des bénéficiaires précise fortement le scoring.",
        "Les champs vides sont ignorés — remplis seulement ce que tu connais.",
      ],
    };
  }
  if (pathname.match(/^\/projects\/[^/]+$/)) {
    return {
      title: "Fiche projet",
      intro:
        "Tu retrouves ici ton cadre logique, les matches IA et les propositions générées.",
      tips: [
        "Clique 'Lancer le matching IA' pour scorer toutes les subventions actives contre ton projet.",
        "Un score ≥ 75 = excellent match. ≥ 50 = bon match. En dessous, vise les partiels.",
        "'Générer une proposition' pré-rédige un dossier adapté au bailleur.",
      ],
      actions: [
        { label: "Explorer toutes les subventions", href: "/grants", icon: Sparkles },
      ],
    };
  }
  if (pathname === "/grants") {
    return {
      title: "Catalogue de subventions",
      intro:
        "~2 800 subventions actives issues d'Aides-Territoires, FDVA, EU Funding, fondations et plus.",
      tips: [
        "Filtre par pays, type (public/privé/fondation/UE), thématique et territoire.",
        "Si aucun résultat strict : on élargit automatiquement ta recherche (bannière jaune).",
        "Associe un projet (`?project_id=`) pour voir les scores de matching sur chaque fiche.",
      ],
      actions: [
        { label: "Créer un projet pour matcher", href: "/projects/new", icon: Sparkles },
      ],
    };
  }
  if (pathname.match(/^\/proposals\/[^/]+$/)) {
    return {
      title: "Brouillon de proposition",
      intro:
        "Un premier jet généré par IA, adapté au bailleur et ton cadre logique.",
      tips: [
        "Exporte en .docx — c'est le document éditable final.",
        "Les passages [À COMPLÉTER] en orange attendent ta relecture humaine.",
        "Le brouillon doit TOUJOURS être relu avant soumission — pas d'envoi automatique.",
      ],
    };
  }
  if (pathname === "/proposals") {
    return {
      title: "Mes propositions",
      intro: "Tous tes brouillons générés, exportables en .docx.",
      tips: [
        "Clique sur une fiche pour voir les sections rendues et télécharger le .docx.",
        "Chaque proposition est liée à un projet et à une subvention — retrouve le contexte facilement.",
      ],
    };
  }
  if (pathname === "/profile") {
    return {
      title: "Mon organisation",
      intro:
        "Ces infos sont utilisées pour l'éligibilité et la rédaction des propositions.",
      tips: [
        "Mission, thématiques et zones géographiques sont utilisées par le scoring.",
        "Les subventions passées crédibilisent tes propositions générées.",
        "Pense à enregistrer après chaque modification.",
      ],
    };
  }
  if (pathname === "/dashboard" || pathname === "/") {
    return {
      title: "Dashboard",
      intro: "Ton point de départ : projets, opportunités, deadlines à surveiller.",
      tips: [
        "Crée un projet d'abord — sans projet, le matching IA ne peut pas tourner.",
        "Les deadlines du mois t'alertent sur les subventions à ne pas rater.",
        "Clique 'Explorer les subventions' pour parcourir le catalogue complet.",
      ],
      actions: [
        { label: "Nouveau projet", href: "/projects/new", icon: Sparkles },
      ],
    };
  }
  // Fallback — generic help
  return {
    title: "Emile, ton copilote financement",
    intro:
      "Ce panneau t'accompagne à chaque étape. Clique sur une autre page pour des conseils contextuels.",
    tips: [
      "Commence par créer un projet et configurer ton organisation.",
      "Lance le matching pour voir les subventions les plus pertinentes.",
      "Génère un brouillon de proposition en un clic.",
    ],
    actions: [
      { label: "Dashboard", href: "/dashboard", icon: ArrowRight },
      { label: "Nouveau projet", href: "/projects/new", icon: Sparkles },
    ],
  };
}

export function HelpAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close when navigating. Without this, the panel stays open across route
  // transitions and shows the previous page's tips until you re-open.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc to close — small nicety that makes the drawer feel native.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const guide = matchGuide(pathname || "/");

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'aide" : "Ouvrir l'aide"}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-[#c8f76f] shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? (
          <X className="h-6 w-6" strokeWidth={2.5} />
        ) : (
          <HelpCircle className="h-6 w-6" strokeWidth={2.5} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Aide contextuelle"
          className="fixed bottom-24 right-6 z-40 w-[min(380px,calc(100vw-3rem))] max-h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl border-2 border-border bg-card p-5 shadow-[6px_6px_0px_0px_#1a1a1a]"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black">{guide.title}</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {guide.intro}
              </p>
            </div>
          </div>

          <ul className="space-y-2 mt-4">
            {guide.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm font-medium leading-relaxed"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border bg-[#ffe066] text-[10px] font-black mt-0.5">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>

          {guide.actions && guide.actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {guide.actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} href={action.href}>
                    <Button size="sm" variant="accent">
                      {Icon && <Icon className="h-4 w-4" />}
                      {action.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-5 pt-4 border-t-2 border-border">
            <a
              href="mailto:francois@tresorier.co?subject=Emile%20%E2%80%94%20besoin%20d%27aide"
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              Une question plus précise ? Écris-moi.
            </a>
          </div>
        </div>
      )}
    </>
  );
}
