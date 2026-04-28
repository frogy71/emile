"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Came from the public project form (homepage or legacy /try) — they've
  // already filled it in. Adjust the copy and route them through
  // /auth/post-signup so the pending project gets created server-side and
  // they land on matches.
  const fromValue = searchParams.get("from");
  const fromFunnel = fromValue === "home" || fromValue === "try";

  // Where to send the user post-auth. /auth/post-signup is a thin client
  // shim that picks up the localStorage payload (if any) and posts it to
  // /api/projects before forwarding to the project detail page. Safe to
  // use even when there's no pending project — it falls through to the
  // dashboard.
  const postAuthPath = "/auth/post-signup";

  async function handleResendConfirmation() {
    if (!email) return;
    setResending(true);
    setResent(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath)}`,
      },
    });
    setResending(false);
    if (!error) {
      setResent(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Pass next= so the email-confirmation link comes back through
        // /auth/callback → post-signup, not straight to /dashboard.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation disabled — we already have a session, so jump
      // straight to the post-signup flow which will pick up any pending
      // project from localStorage.
      router.push(postAuthPath);
      router.refresh();
    } else {
      setError("");
      setLoading(false);
      setSuccess(
        fromFunnel
          ? "Compte créé ! Vérifiez votre email pour découvrir vos subventions."
          : "Compte créé ! Vérifiez votre email pour confirmer votre inscription."
      );
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Google bounces back through /auth/callback — pass next= so it
        // forwards to /auth/post-signup instead of straight to /dashboard.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold text-foreground">
            Emile<span className="text-[#c8f76f] bg-foreground px-1.5 py-0.5 rounded-lg ml-1 text-base">.</span>
          </Link>
          {fromFunnel && (
            <Badge variant="green" className="mx-auto mt-3 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Étape 2/2 — Créez votre compte
            </Badge>
          )}
          <CardTitle className="mt-4">
            {fromFunnel ? "Une dernière étape." : "Créer un compte"}
          </CardTitle>
          <CardDescription>
            {fromFunnel
              ? "Créez votre compte pour voir vos résultats — 30 secondes, sans carte."
              : "Commencez à trouver vos subventions en quelques minutes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            S&apos;inscrire avec Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground font-medium">
                ou par email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email professionnel
              </label>
              <Input
                id="email"
                type="email"
                placeholder="vous@organisation.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <div className="text-sm text-green-700 bg-green-50 border-2 border-green-200 p-3 rounded-lg space-y-2">
                <p className="font-medium">{success}</p>
                <p className="text-xs">
                  Pas reçu ? Vérifie tes spams, ou{" "}
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="font-bold underline hover:text-green-900 disabled:opacity-60"
                  >
                    {resending ? "envoi…" : "renvoie l'email"}
                  </button>
                  .
                </p>
                {resent && (
                  <p className="text-xs font-bold">
                    ✓ Email renvoyé. Il peut mettre 1-2 minutes à arriver.
                  </p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !!success}>
              {loading
                ? "Création..."
                : fromFunnel
                  ? "Voir mes subventions"
                  : "Créer mon compte"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link
              href={fromFunnel ? `/login?from=${fromValue ?? "home"}` : "/login"}
              className="text-primary hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
