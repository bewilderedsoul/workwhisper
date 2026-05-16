// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workwhisper.in";

  const [bowls, companies, roles] = await Promise.all([
    prisma.bowl.findMany({ select: { slug: true, createdAt: true } }),
    prisma.post.findMany({
      where: { company: { not: null }, isDeleted: false },
      select: { company: true, updatedAt: true },
      distinct: ["company"],
    }),
    prisma.post.findMany({
      where: { role: { not: null }, isDeleted: false, type: "SALARY" },
      select: { role: true, updatedAt: true },
      distinct: ["role"],
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/feed`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/bowls`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const bowlRoutes: MetadataRoute.Sitemap = bowls.map((b) => ({
    url: `${baseUrl}/bowl/${b.slug}`,
    lastModified: b.createdAt,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  const companyRoutes: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${baseUrl}/company/${encodeURIComponent(c.company!.toLowerCase().replace(/\s+/g, "-"))}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const roleRoutes: MetadataRoute.Sitemap = roles.map((r) => ({
    url: `${baseUrl}/salary/${encodeURIComponent(r.role!.toLowerCase().replace(/\s+/g, "-"))}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...bowlRoutes, ...companyRoutes, ...roleRoutes];
}
