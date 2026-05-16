// src/app/api/sitemap/route.ts  (also src/app/sitemap.ts for Next.js)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workwhisper.in";

  const bowls = await prisma.bowl.findMany({ select: { slug: true } });
  const companies = await prisma.post.findMany({
    where: { company: { not: null }, isDeleted: false },
    select: { company: true },
    distinct: ["company"],
  });
  const roles = await prisma.post.findMany({
    where: { role: { not: null }, isDeleted: false, type: "SALARY" },
    select: { role: true },
    distinct: ["role"],
  });

  const staticPages = ["/", "/feed", "/bowls", "/login"];

  const urls = [
    ...staticPages.map((p) => `<url><loc>${baseUrl}${p}</loc><changefreq>daily</changefreq></url>`),
    ...bowls.map((b) => `<url><loc>${baseUrl}/bowl/${b.slug}</loc><changefreq>hourly</changefreq></url>`),
    ...companies.map((c) => `<url><loc>${baseUrl}/company/${encodeURIComponent(c.company!.toLowerCase().replace(/\s+/g, "-"))}</loc><changefreq>weekly</changefreq></url>`),
    ...roles.map((r) => `<url><loc>${baseUrl}/salary/${encodeURIComponent(r.role!.toLowerCase().replace(/\s+/g, "-"))}</loc><changefreq>weekly</changefreq></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
