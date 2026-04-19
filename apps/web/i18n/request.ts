import {cookies, headers} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

/**
 * Request-scoped next-intl config (middleware-less mode).
 *
 * 既存ページは `app/[locale]/` 配下ではなく `app/` 直下に置かれているため、
 * URL prefix 方式の next-intl middleware は使わない。代わりに:
 *   1. クッキー `NEXT_LOCALE` を最優先
 *   2. `Accept-Language` ヘッダから判定
 *   3. どちらも無ければデフォルト (`ja`)
 * LocaleSwitcher はクッキーを書き換えて router.refresh() する。
 */
async function resolveLocale(): Promise<(typeof routing.locales)[number]> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
    return cookieLocale as (typeof routing.locales)[number];
  }
  const hdr = await headers();
  const accept = hdr.get('accept-language') ?? '';
  const primary = accept.split(',')[0]?.toLowerCase().split('-')[0];
  if (primary && routing.locales.includes(primary as (typeof routing.locales)[number])) {
    return primary as (typeof routing.locales)[number];
  }
  return routing.defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
