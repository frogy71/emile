import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Emile — Le copilote financement des ONG.",
    template: "%s | Emile",
  },
  description:
    "Emile trouve vos subventions, les classe par pertinence et vous aide à rédiger vos propositions. Le copilote IA pour les ONG et associations françaises.",
  keywords: [
    "subventions",
    "financement associatif",
    "ONG",
    "association",
    "grant finder",
    "matching IA",
    "proposition subvention",
    "appel à projets",
    "financement ESS",
  ],
  authors: [{ name: "Emile" }],
  openGraph: {
    title: "Emile — Le copilote financement des ONG",
    description:
      "2 000+ subventions FR + EU. Matching IA. Propositions générées automatiquement.",
    url: SITE_URL,
    siteName: "Emile",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emile — Le copilote financement des ONG",
    description:
      "2 000+ subventions FR + EU. Matching IA. Propositions générées automatiquement.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
