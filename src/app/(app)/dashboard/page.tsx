import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Target,
  FileText,
  ArrowRight,
  Clock,
  Plus,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

const PLACEHOLDER_PROJECTS = [
  {
    id: "proj-1",
    name: "Aide humanitaire Ukraine",
    color: "bg-[#c8f76f]",
    themes: ["Humanitaire", "Migration"],
    matchCount: 4,
    topScore: 91,
    nextDeadline: "2026-04-20",
  },
  {
    id: "proj-2",
    name: "Inclusion jeunesse",
    color: "bg-[#a3d5ff]",
    themes: ["Jeunesse", "Inclusion"],
    matchCount: 2,
    topScore: 68,
    nextDeadline: "2026-06-15",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Dashboard</h1>
          <p className="text-muted-foreground font-medium">
            Vue d&apos;ensemble de vos projets et opportunités
          </p>
        </div>
        <Link href="/projects/new">
          <Button variant="accent">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">2</p>
              <p className="text-xs font-bold">Projets actifs</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">6</p>
              <p className="text-xs font-bold">Grants matchés</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#ffa3d1] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">2</p>
              <p className="text-xs font-bold">Deadlines ce mois</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-border bg-[#d4b5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">0</p>
              <p className="text-xs font-bold">Propositions créées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <h2 className="mt-10 text-xl font-black">Mes projets</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {PLACEHOLDER_PROJECTS.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-5 w-5 rounded-lg border-2 border-border ${project.color} shrink-0 mt-0.5`}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-black">{project.name}</h3>
                    <div className="flex gap-1.5 mt-2">
                      {project.themes.map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm font-bold">
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" />
                        {project.matchCount} matches
                      </span>
                      <span className="flex items-center gap-1.5 text-[#c8f76f] bg-foreground px-2 py-0.5 rounded-lg">
                        <Sparkles className="h-3.5 w-3.5" />
                        Top: {project.topScore}/100
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(project.nextDeadline).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* New project card */}
        <Link href="/projects/new">
          <div className="flex items-center justify-center h-full min-h-[160px] rounded-2xl border-2 border-dashed border-border bg-background hover:bg-secondary transition-colors cursor-pointer">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-[#c8f76f] shadow-[3px_3px_0px_0px_#1a1a1a]">
                <Plus className="h-6 w-6" strokeWidth={3} />
              </div>
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                Créer un nouveau projet
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
