"use client";
/**
 * 全域で使う細身のアプリバー。右上は「マイページ」+「言語切替」のドロップダウン。
 * - /map では MapView 側が h-[calc(100dvh-var(--app-bar-h))] を使う
 * - ドロップダウン内に主要リンクもまとめる（モバイルのナビとしても機能）
 */
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "../i18n/routing";
import TextSizeSwitcher from "./TextSizeSwitcher";

const NAV_ITEMS: Array<{ href: "/" | "/map" | "/search" | "/learn" | "/offerings" | "/me" | "/submit-shrine"; label: string }> = [
  { href: "/", label: "ホーム" },
  { href: "/map", label: "地図" },
  { href: "/search", label: "一覧" },
  { href: "/learn", label: "学ぶ" },
  { href: "/offerings", label: "奉納" },
  { href: "/me", label: "マイページ" },
  { href: "/submit-shrine", label: "神社の掲載申請" },
];

export default function AppBar() {
  const locale = useLocale();
  const t = useTranslations("locale");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [loginState, setLoginState] = useState<"unknown" | "guest" | "user">("unknown");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.email) {
          setLoginState("user");
          setUserName(data.user.name || data.user.email);
        } else {
          setLoginState("guest");
        }
      })
      .catch(() => setLoginState("guest"));
  }, []);

  useEffect(() => {
    if (!menuOpen) return; // メニューが閉じているときは outside-click ハンドラ不要
    // 開いた直後の同じ tap が closer になるのを防ぐため 1 tick 遅らせる
    let active = false;
    const armTimer = setTimeout(() => { active = true; }, 300);
    const onDown = (e: Event) => {
      if (!active) return;
      if (!menuRef.current) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  // パス変更時は閉じる
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function changeLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-[60] flex h-12 items-center justify-between px-4 md:px-6"
      style={{
        background: "rgba(8,6,4,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(201,155,77,0.22)",
        ["--app-bar-h" as string]: "48px",
      }}
    >
      <Link href="/" className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C99B4D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9h18" />
          <path d="M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
          <path d="M12 5V3" />
          <path d="M7 9v12" />
          <path d="M17 9v12" />
          <path d="M9 21h6" />
        </svg>
        <span className="font-serif font-bold" style={{ color: "#C99B4D", fontSize: "0.95rem", letterSpacing: "0.05em" }}>全国神社スポット</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* 文字サイズ: デスクトップでは常設、モバイルはメニュー内 */}
        <div className="hidden md:block">
          <TextSizeSwitcher />
        </div>
        {/* ログイン状態表示 */}
        {loginState === "guest" && (
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
            style={{ background: "rgba(201,155,77,0.15)", border: "1px solid rgba(201,155,77,0.45)", color: "#C99B4D" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            ログイン
          </Link>
        )}
        {loginState === "user" && (
          <Link
            href="/me"
            className="hidden sm:inline-flex items-center justify-center rounded-full text-xs font-bold text-white transition hover:opacity-90"
            style={{ width: "28px", height: "28px", background: "rgba(201,155,77,0.7)", flexShrink: 0 }}
            title={userName ?? "マイページ"}
          >
            {(userName ?? "？").charAt(0).toUpperCase()}
          </Link>
        )}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex min-h-[32px] items-center gap-1.5 rounded-full border border-shrine-gold/40 bg-night-card px-3 py-1.5 text-xs text-kinari hover:bg-night-50 active:bg-night-50"
          style={{ touchAction: "manipulation" }}
        >
          <span aria-hidden="true">☰</span>
          <span>メニュー</span>
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-md border border-shrine-gold/25 bg-night-50 shadow-lg"
          >
            <ul className="py-1 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      "flex items-center gap-2 px-3 py-2 text-kinari hover:bg-night-100 " +
                      (pathname === item.href ? "bg-night-100 font-semibold text-shrine-gold" : "")
                    }
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* ログイン誘導（未ログイン時） */}
            {loginState === "guest" && (
              <div className="border-t border-shrine-gold/20 px-3 py-2.5">
                <Link
                  href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                  className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold justify-center"
                  style={{ background: "rgba(201,155,77,0.15)", border: "1px solid rgba(201,155,77,0.4)", color: "#C99B4D" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  Googleでログイン / 会員登録
                </Link>
                <p className="mt-1.5 text-center text-[10px]" style={{ color: "rgba(220,202,168,0.4)" }}>ブックマーク・参拝記録を同期</p>
              </div>
            )}
            {/* モバイル向け: メニュー内に文字サイズ切替 */}
            <div className="border-t border-shrine-gold/20 px-3 py-2 md:hidden">
              <p className="mb-1 text-[11px] text-kinari/70">文字サイズ</p>
              <TextSizeSwitcher />
            </div>
            <div className="border-t border-shrine-gold/20 px-3 py-2">
              <label className="flex items-center justify-between gap-2 text-[11px] text-kinari/70">
                <span>🌐 言語</span>
                <select
                  value={locale}
                  onChange={(e) => changeLocale(e.target.value)}
                  className="rounded border border-shrine-gold/30 bg-night-card px-2 py-1 text-xs text-kinari outline-none"
                >
                  {routing.locales.map((loc) => (
                    <option key={loc} value={loc}>
                      {t(loc)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </header>
  );
}
