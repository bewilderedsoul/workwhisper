// src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workwhisper.in";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/profile", "/post/new"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
