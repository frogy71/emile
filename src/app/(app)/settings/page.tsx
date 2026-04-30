"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Bell, CreditCard, Check, Sparkles, Loader2, FileText, ExternalLink, Crown, Receipt } from "lucide-react";

export default function SettingsPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState("weekly");
  const [alertMinScore, setAlertMinScore] = useState("60");
  const [alertSaved, setAlertSaved] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);

  async function handleCheckout(plan: "pro" | "expert") {
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
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pro */}
              <div className="relative rounded-2xl border-4 border-foreground bg-[#ffe066] p-6 shadow-[6px_6px_0px_0px_#1a1a1a]">
                <Badge
                  variant="default"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 text-[10px] font-black whitespace-nowrap"
                >
                  Le plus populaire
                </Badge>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black">Pro</h3>
                      <Badge variant="green">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Illimité
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground/80 font-medium">
                      Pour les associations qui répondent régulièrement.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">79€</p>
                    <p className="text-xs text-foreground/70 font-bold">/mois HT</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2">
                  {[
                    "Matchings illimités",
                    "Top 50 résultats",
                    "5 dossiers IA / mois",
                    "Alertes intelligentes",
                    "Feedback learning",
                    "Export DOCX + support email",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm font-semibold">
                      <Check className="h-4 w-4 text-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="default"
                  className="w-full mt-6"
                  onClick={() => handleCheckout("pro")}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === "pro" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Passer Pro — 79€/mois HT
                </Button>
              </div>

              {/* Expert */}
              <div className="rounded-2xl border-2 border-border bg-[#a3d5ff] p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black">Expert</h3>
                      <Badge variant="default">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground/80 font-medium">
                      Pour les structures à activité quotidienne.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">199€</p>
                    <p className="text-xs text-foreground/70 font-bold">/mois HT</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2">
                  {[
                    "Tout illimité",
                    "Dossiers IA illimités",
                    "Accès prioritaire aux nouvelles subventions",
                    "Dashboard analytics avancé",
                    "Support prioritaire",
                    "Multi-projets illimité",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm font-semibold">
                      <Check className="h-4 w-4 text-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => handleCheckout("expert")}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === "expert" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crown className="h-4 w-4" />
                  )}
                  Choisir Expert — 199€/mois HT
                </Button>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Paiement sécurisé via Stripe. Annulation possible à tout moment.
              Associations loi 1901 : TVA non applicable.
            </p>
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
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/settings/billing">
              <Button variant="default">
                <Receipt className="h-4 w-4" />
                Mes factures
              </Button>
            </Link>
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
              Portail Stripe
            </Button>
            <p className="basis-full text-xs text-muted-foreground">
              Téléchargez vos factures PDF dans la page « Mes factures », ou ouvrez le portail Stripe pour modifier votre carte ou votre plan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
