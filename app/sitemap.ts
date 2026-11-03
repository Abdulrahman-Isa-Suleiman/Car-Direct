import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/home-data";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed = ["", "/vehicles", "/vehicles?powertrain=EREV", "/vehicles?powertrain=PHEV", "/vehicles?powertrain=BEV",
    "/vehicles?condition=fairly_used", "/terms/deposit", "/privacy"];
  const slugs = await getAllSlugs();
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 })),
    ...slugs.map((s) => ({ url: `${SITE_URL}/vehicles/${s}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
