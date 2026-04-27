import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Script from 'next/script';
import AppBar from '../components/AppBar';
import '../styles/globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zenkokujinjyaspot.com";

export const metadata: Metadata = {
  title: {
    default: '全国神社スポット — Shrine Map of Japan',
    template: '%s | 全国神社スポット',
  },
  description:
    '自分に合う神社を見つけ、学び、訪れ、支える。レビュー・参拝チェックイン・奉納まで一貫した神社プラットフォーム。',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: '全国神社スポット',
    locale: 'ja_JP',
  },
  robots: { index: true, follow: true },
};

// WebSite + Organization Schema（サイト全体のLLMO基盤）
const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "全国神社スポット",
      "description": "46,000社以上の神社データベースと五行・数秘術・干支に基づく守護神社診断を提供する神社ポータル",
      "inLanguage": "ja",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "全国神社スポット",
      "url": SITE_URL,
      "description": "日本全国46,000社以上の神社情報データベース。五行属性・数秘ライフパスナンバー・干支を組み合わせた独自の守護神社診断システムを運営。"
    }
  ]
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#FBF7EC',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@600;700&display=swap"
          rel="stylesheet"
        />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
      </head>
      <body className="min-h-screen pt-10">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppBar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
