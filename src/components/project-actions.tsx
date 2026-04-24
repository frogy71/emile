"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface ProjectActionsProps {
  projectId: string;
  projectName: string;
}

export function ProjectActions({ projectId }: ProjectActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
    }
  }

  if (deleting) {
    return (
      <div className="flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-2">
        <p className="text-sm font-bold text-red-700">Supprimer ce projet ?</p>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "..." : "Oui, supprimer"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDeleting(false)}>
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/projects/${projectId}/edit`}>
        <Button size="sm" variant="outline">
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Button>
      </Link>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:bg-red-50"
        onClick={() => setDeleting(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </Button>
    </div>
  );
}
