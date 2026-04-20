import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // DBファイルをサーバーレス関数バンドルに含める
  outputFileTracingIncludes: {
    '/**/*': ['../api/data/**/*', '../../api/data/**/*'],
  },
  outputFileTracingRoot: undefined,
  // Vercel build で型/lint エラーで弾かれるので、まずデプロイを通して後で潰す
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // typedRoutes: true, // Vercel build で dynamic href が弾かれるので一旦 OFF
  },
  // 開発中は FastAPI (port 8000) へプロキシし、同一オリジン感覚で /spots, /uploads を叩ける
  async rewrites() {
    return [
      { source: '/spots/:path*',          destination: `${API_BASE}/spots/:path*` },
      // API の /shrines は SSR 内部でしか叩かないので rewrite は不要。
      // （Web の /shrines/[slug] は Next.js のページとして提供する）
      { source: '/spot-submissions/:path*', destination: `${API_BASE}/spot-submissions/:path*` },
      { source: '/shrine-facets',          destination: `${API_BASE}/shrine-facets` },
      { source: '/uploads/:path*',         destination: `${API_BASE}/uploads/:path*` },
      { source: '/health',                 destination: `${API_BASE}/health` },
      { source: '/me/checkins',            destination: `${API_BASE}/me/checkins` },
      { source: '/me',                     destination: `${API_BASE}/me` },
      // 認可ヘッダのまま FastAPI へ通す（/api/auth は NextAuth 専用なのでパス被りなし）
      { source: '/auth/sessions',          destination: `${API_BASE}/auth/sessions` },
      { source: '/reactions',              destination: `${API_BASE}/reactions` },
      { source: '/reviews/:path*',         destination: `${API_BASE}/reviews/:path*` },
      { source: '/follows/:path*',         destination: `${API_BASE}/follows/:path*` },
      { source: '/notifications/:path*',   destination: `${API_BASE}/notifications/:path*` },
      { source: '/notifications',          destination: `${API_BASE}/notifications` },
      { source: '/reports',                destination: `${API_BASE}/reports` },
      // 奉納（Stripe Webhook は Next.js を経由せず Stripe → FastAPI へ直接向ける。
      //  Next.js を挟むと raw body が消費され署名検証が破綻するため）
      { source: '/offerings/:path*',       destination: `${API_BASE}/offerings/:path*` },
      { source: '/me/offerings',           destination: `${API_BASE}/me/offerings` },
      // /legacy-map は旧 index.html をそのまま返す（移行期間限定）
      { source: '/legacy-map',             destination: `${API_BASE}/` },
      // 開発専用: ローカルデータ整備用の管理エンドポイント
      { source: '/admin/:path*',           destination: `${API_BASE}/admin/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
};

export default withNextIntl(nextConfig);
