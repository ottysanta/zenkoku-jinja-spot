import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

/**
 * next-intl routing configuration.
 *
 * Phase 2: pages migrate incrementally; keys live in messages/{locale}.json.
 * - Japanese (default) URLs stay at root: `/map`, `/learn`, ...
 * - English URLs get an `/en` prefix: `/en/map`, `/en/learn`, ...
 *
 * Tested against next-intl@3.26.3 (App Router + `createNavigation`).
 */
export const routing = defineRouting({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];

// Lightweight wrappers around Next.js navigation APIs that are
// locale-aware. Components should prefer these over `next/link` etc.
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
