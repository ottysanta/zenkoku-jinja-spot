'use client';

import {useLocale, useTranslations} from 'next-intl';
import {useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {routing} from '../i18n/routing';

/**
 * Middleware-less ロケール切替え。
 * クッキー `NEXT_LOCALE` を書き換えて `router.refresh()` で再レンダリング。
 * URL は変えないので既存ページ構造 (`app/` 直下) を崩さない。
 */
export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('locale');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(nextLocale: string) {
    // 1 年 cookie で記憶
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-[#FBF7EC] px-2 py-1 text-xs shadow-sm">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        className="bg-transparent text-xs outline-none"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </label>
  );
}
