import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublishedPostBySlug,
  listRelatedPosts,
  incrementViewCount,
  type PublicBlogPost,
} from "@/lib/blog/queries";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { title: "Article introuvable | Émile" };
  }
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || undefined,
    keywords: post.keywords || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || undefined,
      url,
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      images: post.cover_image_url
        ? [{ url: post.cover_image_url, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta_title || post.title,
      description: post.meta_description || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

function buildArticleSchema(post: PublicBlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: "Émile",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Émile",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.keywords?.join(", ") || undefined,
  };
}

function buildBreadcrumbSchema(post: PublicBlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${post.slug}`,
      },
    ],
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Best-effort view counter — fire and forget so SSR isn't blocked.
  void incrementViewCount(post.slug).catch(() => {});

  const related = await listRelatedPosts({
    excludeId: post.id,
    thematicTag: post.thematic_tag,
    limit: 4,
  });

  const articleSchema = buildArticleSchema(post);
  const breadcrumbSchema = buildBreadcrumbSchema(post);
  const faqSchema = post.faq_schema as Record<string, unknown> | null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="mx-auto max-w-5xl px-6 py-12">
        <nav
          aria-label="Fil d'Ariane"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{post.title}</span>
        </nav>

        <header className="mb-10">
          {post.thematic_tag && (
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {post.thematic_tag}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {post.published_at &&
              new Date(post.published_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            {post.word_count
              ? ` · ${Math.max(1, Math.round(post.word_count / 200))} min de lecture`
              : ""}
          </p>
        </header>

        {post.cover_image_url && (
          <div className="mb-10 overflow-hidden rounded-2xl border-2 border-border">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={1200}
              height={630}
              className="h-auto w-full"
              unoptimized
              priority
            />
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article
            className="emile-blog-article prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />

          {related.length > 0 && (
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                À lire aussi
              </h2>
              <ul className="space-y-4">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/blog/${r.slug}`}
                      className="block rounded-xl border-2 border-border p-4 hover:bg-muted"
                    >
                      {r.thematic_tag && (
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          {r.thematic_tag}
                        </p>
                      )}
                      <p className="text-sm font-bold leading-snug">
                        {r.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
