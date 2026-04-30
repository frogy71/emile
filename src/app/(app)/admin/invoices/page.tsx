"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, FileText, Receipt } from "lucide-react";

interface AdminInvoice {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  plan: string | null;
  status: string;
  stripe_invoice_id: string | null;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
  created_at: string;
  paid_at: string | null;
  organization_id: string;
  organizations: { name: string } | null;
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  });
}

function statusVariant(s: string): "green" | "yellow" | "pink" | "secondary" {
  if (s === "paid") return "green";
  if (s === "open" || s === "pending" || s === "draft") return "yellow";
  if (s === "uncollectible" || s === "void") return "pink";
  return "secondary";
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError("Non authentifié");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/admin/invoices", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          const body = await res.json();
          setError(body.error || `HTTP ${res.status}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (active) setInvoices(data.invoices || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur réseau");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + (i.amount_cents || 0), 0);
  const totalOpen = invoices
    .filter((i) => i.status !== "paid")
    .reduce((acc, i) => acc + (i.amount_cents || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground">Factures</h1>
          <p className="text-muted-foreground font-medium">
            Toutes les factures Stripe synchronisées
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-2xl border-2 border-border bg-[#c8f76f] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6" />
            <div>
              <p className="text-3xl font-black">{invoices.length}</p>
              <p className="text-xs font-bold">Factures totales</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <p className="text-3xl font-black">{formatAmount(totalPaid, "eur")}</p>
          <p className="text-xs font-bold">Total encaissé</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-[#ffe066] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <p className="text-3xl font-black">{formatAmount(totalOpen, "eur")}</p>
          <p className="text-xs font-bold">En attente</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground font-medium">Chargement…</p>
      ) : error ? (
        <p className="text-red-600 font-bold">{error}</p>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-black">Aucune facture pour l&apos;instant</p>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Les factures apparaîtront ici dès la première souscription Stripe.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_#1a1a1a] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-black text-xs">Numéro</th>
                <th className="px-3 py-2 text-left font-black text-xs">
                  Organisation
                </th>
                <th className="px-3 py-2 text-left font-black text-xs">Plan</th>
                <th className="px-3 py-2 text-right font-black text-xs">
                  Montant
                </th>
                <th className="px-3 py-2 text-left font-black text-xs">Statut</th>
                <th className="px-3 py-2 text-left font-black text-xs">Émise</th>
                <th className="px-3 py-2 text-left font-black text-xs">Payée</th>
                <th className="px-3 py-2 text-right font-black text-xs">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">
                    {inv.invoice_number}
                  </td>
                  <td className="px-3 py-2 font-bold">
                    {inv.organizations?.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{inv.plan || "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatAmount(inv.amount_cents, inv.currency)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {inv.paid_at
                      ? new Date(inv.paid_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {inv.pdf_url ? (
                      <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </a>
                    ) : inv.hosted_invoice_url ? (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Voir
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
