import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 通常クローラー
      { userAgent: "*", allow: "/", disallow: ["/api/", "/signin"] },
      // AIクローラーを明示許可（LLMO/GEO対策）
      { userAgent: "GPTBot",            allow: "/" },
      { userAgent: "ClaudeBot",         allow: "/" },
      { userAgent: "anthropic-ai",      allow: "/" },
      { userAgent: "PerplexityBot",     allow: "/" },
      { userAgent: "Google-Extended",   allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "cohere-ai",         allow: "/" },
      { userAgent: "Bytespider",        allow: "/" },
      { userAgent: "Meta-ExternalAgent", allow: "/" },
      { userAgent: "Amazonbot",         allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
