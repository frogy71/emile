import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BlogPostNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-3xl font-black tracking-tight mb-4">
        Article introuvable
      </h1>
      <p className="text-muted-foreground mb-8">
        Cet article a peut-être été dépublié, ou l&apos;URL est incorrecte.
      </p>
      <Link href="/blog">
        <Button variant="accent">Retour au blog</Button>
      </Link>
    </main>
  );
}
