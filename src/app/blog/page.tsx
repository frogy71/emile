import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "@/lib/blog/queries";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

export const metadata: Metadata = {
  title: "Blog Émile — Le Grant du Jour",
  description:
    "Chaque jour, un appel à projets décrypté pour les associations et porteurs de projets : éligibilité, montant, deadline et conseils pour candidater.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Blog Émile — Le Grant du Jour",
    description:
      "Chaque jour, un appel à projets décrypté pour les associations et porteurs de projets.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

const PAGE_SIZE = 12;

interface SearchParams {
  page?: string;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const { posts, total } = await listPublishedPosts({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Le blog Émile
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Le Grant du Jour
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Chaque jour, un appel à projets décrypté : qui peut candidater, à
          combien, et comment se positionner. Outils, contexte, repères. Le
          blog des associations qui veulent comprendre ce qui se finance.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border-2 border-border bg-muted/30 p-10 text-center">
          <p className="text-muted-foreground">
            Aucun article publié pour le moment. Le premier &quot;Grant du
            Jour&quot; arrive bientôt.
          </p>
        </div>
      ) : (
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.id} className="group">
              <Link href={`/blog/${p.slug}`} className="block">
                <article className="overflow-hidden rounded-2xl border-2 border-border bg-card transition-shadow hover:shadow-[8px_8px_0px_0px_var(--foreground)]">
                  {p.cover_image_url ? (
                    <div className="aspect-[1200/630] w-full overflow-hidden bg-muted">
                      <Image
                        src={p.cover_image_url}
                        alt={p.title}
                        width={1200}
                        height={630}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="aspect-[1200/630] w-full bg-[#c8f76f]" />
                  )}
                  <div className="p-6">
                    {p.thematic_tag && (
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {p.thematic_tag}
                      </p>
                    )}
                    <h2 className="text-xl font-black leading-tight tracking-tight">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {p.meta_description}
                    </p>
                    {p.published_at && (
                      <p className="mt-4 text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {p.word_count
                          ? ` · ${Math.max(1, Math.round(p.word_count / 200))} min de lecture`
                          : ""}
                      </p>
                    )}
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-16 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}`}
              className="rounded-lg border-2 border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              ← Précédent
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="rounded-lg border-2 border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
