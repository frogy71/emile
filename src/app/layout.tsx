import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emile — Le copilote financement des ONG.",
  description:
    "Emile trouve vos subventions, les classe par pertinence et vous aide à rédiger vos propositions. Le copilote IA pour les ONG et associations.",
  openGraph: {
    title: "Emile — Le copilote financement des ONG",
    description: "2 000+ subventions FR + EU. Matching IA. Propositions générées automatiquement.",
    url: "https://grant-finder-kappa.vercel.app",
    siteName: "Emile",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emile — Le copilote financement des ONG",
    description: "2 000+ subventions FR + EU. Matching IA. Propositions générées automatiquement.",
  },
  robots: { index: true, follow: true },
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
