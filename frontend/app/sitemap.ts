import type { MetadataRoute } from "next";
import { LEGAL_UPDATED_ISO, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const legalUpdated = new Date(LEGAL_UPDATED_ISO);
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: legalUpdated,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: legalUpdated,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: legalUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      lastModified: legalUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
