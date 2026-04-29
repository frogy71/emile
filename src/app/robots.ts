import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/signup", "/legal", "/blog"],
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/grants",
          "/matching",
          "/projects",
          "/proposals",
          "/settings",
          "/onboarding",
          "/auth/",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
