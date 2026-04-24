"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle } from "lucide-react";

interface MatchButtonProps {
  projectId: string;
}

export function MatchButton({ projectId }: MatchButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    highMatches: number;
    goodMatches: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/match`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du matching");
      }
      setResult({
        total: data.total,
        highMatches: data.highMatches,
        goodMatches: data.goodMatches,
      });
      // Refresh the server component to show new matches
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleMatch} disabled={loading} variant="default">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Matching en cours...
          </>
        ) : result ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Relancer le matching
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Lancer le matching IA
          </>
        )}
      </Button>
      {result && (
        <p className="text-sm font-bold text-green-700">
          {result.highMatches} excellents · {result.goodMatches} bons matchs
          (sur {result.total} subventions)
        </p>
      )}
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
