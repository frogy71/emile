"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, X, Check } from "lucide-react";

interface ProjectActionsProps {
  projectId: string;
  projectName: string;
}

export function ProjectActions({ projectId, projectName }: ProjectActionsProps) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(projectName);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRename() {
    if (!newName.trim() || newName === projectName) {
      setRenaming(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      setRenaming(false);
      router.refresh();
    }
  }

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
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDeleting(false)}
        >
          Annuler
        </Button>
      </div>
    );
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-64"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setRenaming(false);
          }}
        />
        <Button size="icon" variant="outline" onClick={handleRename} disabled={loading}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => setRenaming(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRenaming(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Renommer
      </Button>
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
