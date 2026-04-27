"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Removes a saved grant from the user's list. Sits on the /saved page next
 * to each row. Optimistic UI is intentionally kept simple — we just disable
 * the row while the request is in flight, then refresh the server component
 * on success so the row disappears.
 */
export function UnsaveButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/grants/${grantId}/interact?type=save`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      toast.success("Subvention retirée des sauvegardées");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(
        "Impossible de retirer la sauvegarde",
        e instanceof Error ? e.message : undefined
      );
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="text-muted-foreground hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <BookmarkX className="h-3.5 w-3.5" />
      )}
      Retirer
    </Button>
  );
}
