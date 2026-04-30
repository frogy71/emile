"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";

interface UserInvoice {
  id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  plan: string | null;
  status: string;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
  created_at: string;
  paid_at: string | null;
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  });
}

function statusLabel(s: string): { label: string; variant: "green" | "yellow" | "pink" | "secondary" } {
  if (s === "paid") return { label: "Payée", variant: "green" };
  if (s === "open") return { label: "À payer", variant: "yellow" };
  if (s === "draft") return { label: "Brouillon", variant: "secondary" };
  if (s === "void") return { label: "Annulée", variant: "pink" };
  if (s === "uncollectible") return { label: "Échec", variant: "pink" };
  return { label: s, variant: "secondary" };
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<UserInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/invoices");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setInvoices(data.invoices || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function openPortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur");
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black text-foreground">Facturation</h1>
        <p className="text-muted-foreground font-medium">
          Vos factures et historique de paiements
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mes factures
            </CardTitle>
            <CardDescription>
              Téléchargez vos factures PDF en un clic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground font-medium">Chargement…</p>
            ) : invoices.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-base font-black">Aucune facture</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Vos factures apparaîtront ici dès votre première souscription.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border-2 border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-black text-xs">
                        Numéro
                      </th>
                      <th className="px-3 py-2 text-left font-black text-xs">
                        Plan
                      </th>
                      <th className="px-3 py-2 text-right font-black text-xs">
                        Montant
                      </th>
                      <th className="px-3 py-2 text-left font-black text-xs">
                        Statut
                      </th>
                      <th className="px-3 py-2 text-left font-black text-xs">
                        Date
                      </th>
                      <th className="px-3 py-2 text-right font-black text-xs">
                        PDF
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const status = statusLabel(inv.status);
                      return (
                        <tr key={inv.id} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs">
                            {inv.invoice_number}
                          </td>
                          <td className="px-3 py-2 text-xs">{inv.plan || "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatAmount(inv.amount_cents, inv.currency)}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {inv.pdf_url ? (
                              <a
                                href={inv.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <Download className="h-3.5 w-3.5" />
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
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gérer mon abonnement</CardTitle>
            <CardDescription>
              Mettre à jour votre carte, modifier votre plan ou annuler via le portail Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={openPortal} disabled={loadingPortal}>
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Ouvrir le portail Stripe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
