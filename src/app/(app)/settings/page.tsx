"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, CreditCard, Check, Sparkles, Loader2, FileText, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState("weekly");
  const [alertMinScore, setAlertMinScore] = useState("60");
  const [alertSaved, setAlertSaved] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);

  async function handleCheckout(plan: "monthly" | "annual") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur lors de la création du paiement");
      }
    } catch {
      alert("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black text-foreground">Paramètres</h1>
        <p className="text-muted-foreground font-medium">
          Gérez vos alertes et votre abonnement
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Alert preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes email
            </CardTitle>
            <CardDescription>
              Recevez un récapitulatif quand Emile trouve de nouveaux matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold mb-1.5 block">Fréquence</label>
                <select
                  className="flex h-11 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm font-medium"
                  value={alertFrequency}
                  onChange={(e) => { setAlertFrequency(e.target.value); setAlertSaved(false); }}
                >
                  <option value="weekly">Hebdomadaire (recommandé)</option>
                  <option value="daily">Quotidien</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Score minimum pour alertes
                </label>
                <Input
                  type="number"
                  value={alertMinScore}
                  onChange={(e) => { setAlertMinScore(e.target.value); setAlertSaved(false); }}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Seules les subventions avec un score ≥ ce seuil déclenchent une alerte
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                disabled={savingAlerts}
                onClick={async () => {
                  setSavingAlerts(true);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        alert_frequency: alertFrequency,
                        alert_min_score: parseInt(alertMinScore, 10),
                      }),
                    });
                    if (res.ok) setAlertSaved(true);
                  } catch { /* ignore */ }
                  setSavingAlerts(false);
                }}
              >
                {savingAlerts ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sauvegarder les préférences
              </Button>
              {alertSaved && (
                <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Sauvegardé
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Gérez votre plan et votre facturation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black">Emile Pro</h3>
                    <Badge variant="green">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground font-medium">
                    Accès complet à Emile pour votre organisation
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black">79€</p>
                  <p className="text-sm text-muted-foreground font-bold">/mois HT</p>
                </div>
              </div>

              <div className="mt-6 grid gap-2 md:grid-cols-2">
                {[
                  "Catalogue exhaustif France + UE",
                  "Matching IA illimité (GrantScore)",
                  "Alertes email personnalisées",
                  "Génération de propositions IA",
                  "Projets illimités",
                  "Export des brouillons (.docx)",
                  "3 000+ subventions surveillées",
                  "Support prioritaire",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="h-4 w-4 text-[#c8f76f]" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCheckout("monthly")}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Mensuel — 79€/mois HT
                </Button>
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => handleCheckout("annual")}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === "annual" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Annuel — 59€/mois HT
                  <Badge variant="default" className="ml-2 bg-foreground text-background text-[10px]">
                    -25%
                  </Badge>
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Annuel : 708€/an au lieu de 948€ — Économisez 240€
              </p>

              <p className="mt-3 text-xs text-muted-foreground text-center">
                Paiement sécurisé via Stripe. Annulation possible à tout moment.
                <br />
                Une subvention décrochée rembourse des années d&apos;abonnement.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invoices / Billing Portal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturation
            </CardTitle>
            <CardDescription>
              Consultez vos factures, mettez à jour votre moyen de paiement ou modifiez votre plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={async () => {
                setLoadingPortal(true);
                try {
                  const res = await fetch("/api/stripe/portal", {
                    method: "POST",
                  });
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
              }}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gérer mon abonnement et mes factures
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Accédez au portail Stripe pour télécharger vos factures PDF, modifier votre carte ou changer de plan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
