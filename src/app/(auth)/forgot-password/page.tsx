"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

/**
 * /forgot-password — request a password reset link.
 *
 * Flow:
 *  1. User enters email → we call resetPasswordForEmail with redirectTo
 *     pointing at /auth/callback?next=/reset-password.
 *  2. Supabase sends an email with a magic link. Clicking it lands the user
 *     on /auth/callback, which exchanges the code for a session and then
 *     redirects to /reset-password where they set a new password.
 *
 * We always show the success state (even if the email doesn't exist) to
 * avoid leaking account existence.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      // Most errors (rate limit) shouldn't leak account existence — show a
      // generic success message unless it's a hard failure.
      console.error("resetPasswordForEmail:", error);
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold text-foreground">
            Emile
            <span className="text-[#c8f76f] bg-foreground px-1.5 py-0.5 rounded-lg ml-1 text-base">
              .
            </span>
          </Link>
          <CardTitle className="mt-4">Mot de passe oublié ?</CardTitle>
          <CardDescription>
            {sent
              ? "Vérifie ta boîte mail."
              : "Entre ton email, on t'envoie un lien pour en créer un nouveau."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border-2 border-green-600 bg-green-50 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-700" />
                <div className="text-sm font-medium text-green-800">
                  Si un compte existe pour{" "}
                  <span className="font-black">{email}</span>, un email avec un
                  lien de réinitialisation vient de partir. Pense à vérifier
                  tes spams.
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Renvoyer un autre email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@organisation.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi…" : "M'envoyer le lien"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
