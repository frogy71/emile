import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, CreditCard, Check, Sparkles } from "lucide-react";

export default function SettingsPage() {
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
                <select className="flex h-11 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm font-medium">
                  <option value="weekly">Hebdomadaire (recommandé)</option>
                  <option value="daily">Quotidien</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block">
                  Score minimum pour alertes
                </label>
                <Input type="number" defaultValue={60} min={0} max={100} />
                <p className="text-xs text-muted-foreground mt-1">
                  Seules les subventions avec un score ≥ ce seuil déclenchent une alerte
                </p>
              </div>
            </div>
            <Button variant="default">Sauvegarder les préférences</Button>
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
                <Button variant="outline" className="w-full">
                  Mensuel — 79€/mois HT
                </Button>
                <Button variant="accent" className="w-full">
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
                Annulation possible à tout moment.
                <br />
                Une subvention décrochée rembourse des années d&apos;abonnement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
