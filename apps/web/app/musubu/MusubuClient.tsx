"use client";

import { useEffect } from "react";
import Link from "next/link";

const LINE_URL = "https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql";

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const d = Number((e.target as HTMLElement).dataset.delay ?? 0);
            setTimeout(() => e.target.classList.add("vis"), d);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function LineBtn({ label = "縁の地図を受け取る（無料）", lg = true }: { label?: string; lg?: boolean }) {
  return (
    <a
      href={LINE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`line-glow inline-flex items-center gap-3 rounded-full font-bold text-white transition-transform duration-200 hover:scale-105 active:scale-95 ${
        lg ? "px-10 py-5 text-base md:text-lg" : "px-8 py-4 text-sm"
      }`}
      style={{ background: "#06C755" }}
    >
      <svg className={lg ? "w-6 h-6 flex-shrink-0" : "w-5 h-5 flex-shrink-0"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      {label}
    </a>
  );
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-base text-sumi/70 leading-[2] ${className}`}>{children}</p>
  );
}

export default function MusubuClient() {
  useReveal();

  return (
    <>
      <style>{`
        [data-reveal]{opacity:0;transition:opacity .9s ease}
        [data-reveal].vis{opacity:1}
        [data-reveal="up"]{opacity:0;transform:translateY(12px);transition:opacity .8s ease,transform .8s ease}
        [data-reveal="up"].vis{opacity:1;transform:none}
        @keyframes glow{0%,100%{box-shadow:0 8px 24px rgba(6,199,85,.38)}50%{box-shadow:0 8px 44px rgba(6,199,85,.62)}}
        .line-glow{animation:glow 3s ease-in-out infinite}
      `}</style>

      {/* ═══════════════════════════════════════ */}
      {/* HERO                                    */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-white border-b border-sumi/6 px-5 pt-12 pb-14 md:pt-16 md:pb-20">
        <div className="max-w-xl mx-auto">

          <p data-reveal className="text-[10px] tracking-[0.55em] text-gold font-medium mb-6 text-center">
            守護神社診断を終えたあなたへ
          </p>

          <h1
            data-reveal
            data-delay="60"
            className="font-serif text-[2rem] md:text-[2.8rem] text-sumi leading-[1.42] mb-6 text-center"
            style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
          >
            同じように神社に通っているのに、<span className="text-vermilion">なぜあの人の人間関係は軽くて、あなたはずっと重いままなのか。</span>
          </h1>

          <div data-reveal data-delay="140" className="w-10 h-px bg-gold/40 mx-auto mb-6" />

          <div data-reveal data-delay="200" className="max-w-md mx-auto text-center space-y-3">
            <P>
              守護神社診断の結果に、実は<strong className="text-sumi">「あなたの人間関係が変わらない理由」</strong>が隠れています。
            </P>
            <P>
              この7日間で、すべて解き明かします。
            </P>
          </div>

          <div data-reveal data-delay="280" className="flex justify-center mt-8">
            <LineBtn lg />
          </div>
          <p data-reveal data-delay="320" className="text-center text-sumi/25 text-[11px] mt-3">
            無料・登録30秒・いつでも解除できます
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 01 — 共感（体験させる痛み）    */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-washi px-5 py-14 md:py-18">
        <div className="max-w-xl mx-auto">

          <div data-reveal className="mb-8">
            <h2
              className="font-serif text-[1.65rem] md:text-[2.1rem] text-sumi leading-snug"
              style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
            >
              今この瞬間、<span className="text-vermilion">こんなことを感じていませんか。</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                cat: "職場",
                scene: "月曜の朝、目が覚めた瞬間に胃が重くなる。",
                body: "行きたくない。でも行かなきゃいけない。この繰り返しが、何年も続いている。上司の顔を思い浮かべるだけで、体が固まる。",
              },
              {
                cat: "家族・夫婦",
                scene: "同じ食卓に座っているのに、誰も本音を言わない。",
                body: "「うん」「そう」だけの会話。かつてこんな家族じゃなかったはずなのに、いつからこうなったのか、もうわからない。",
              },
              {
                cat: "恋愛",
                scene: "また、同じだった。",
                body: "どうして私はいつもこうなるんだろう。次こそはと思っても、なぜか同じ終わり方をしてしまう。もう誰かを信じることが怖い。",
              },
              {
                cat: "友人・社会",
                scene: "「楽しかった」と言いながら、家に帰ると空虚になる。",
                body: "笑ってはいた。でも本音は一度も言えなかった。本当のことを話せる人が、実はひとりもいないかもしれない。",
              },
              {
                cat: "自分自身",
                scene: "ひとりになると、自分が嫌いになる。",
                body: "もっとうまくできるはずなのに。なんでこんなに不器用なんだろう。「どうせ私なんて」という声が、頭の中でずっと鳴っている。",
              },
            ].map((w, i) => (
              <div
                key={i}
                data-reveal="up"
                data-delay={String(i * 55)}
                className="bg-white rounded-lg px-5 py-5"
                style={{ boxShadow: "0 1px 12px rgba(28,22,19,.06)" }}
              >
                <p className="text-[10px] tracking-[0.3em] text-gold font-semibold mb-2">{w.cat}</p>
                <p
                  className="font-serif text-[1.05rem] text-sumi mb-2"
                  style={{ fontFamily: "'Shippori Mincho', serif" }}
                >
                  {w.scene}
                </p>
                <P>{w.body}</P>
              </div>
            ))}
          </div>

          <div data-reveal data-delay="320" className="mt-8 border-l-2 border-vermilion/50 pl-5">
            <p
              className="font-serif text-lg text-sumi mb-1"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              1つでも「わかる」と思ったなら——
            </p>
            <P className="text-sumi/85 font-medium">
              今日ここに来たのは、偶然ではありません。
            </P>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 02 — なぜ変わらないのか        */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-white px-5 py-14 md:py-18">
        <div className="max-w-xl mx-auto">

          <div data-reveal className="mb-7">
            <h2
              className="font-serif text-[1.65rem] md:text-[2.1rem] text-sumi leading-snug"
              style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
            >
              神社に行くたびに「変わりたい」と手を合わせる。<span className="text-vermilion">それでも、なぜ変わらないのか。</span>
            </h2>
          </div>

          <div data-reveal data-delay="100" className="space-y-4">
            <P>
              あなたは十分、頑張ってきました。引き寄せも、瞑想も、自己啓発本も試した。それでも変わらなかった。
            </P>
            <P>
              なぜか。答えは単純です。<strong className="text-sumi">あなたには「縁のクセ」があるからです。</strong>
            </P>
            <P>
              縁のクセとは、あなたが無意識のうちに引き込まれてしまう人間関係のパターンのこと。このクセを知らないまま何をしても、同じ悩みが形を変えて繰り返されるだけです。
            </P>
            <P>
              そして、<strong className="text-sumi">守護神社診断の結果に、あなたの縁のクセが隠れています。</strong>診断で出た守護神の属性は、あなたがどういう縁を引き寄せやすいかを示しています。
            </P>
          </div>

          <div data-reveal data-delay="220" className="mt-8 bg-sumi rounded-xl px-6 py-7">
            <p
              className="font-serif text-lg text-white leading-[1.85] mb-3"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              このまま何も知らなければ——
            </p>
            <p className="text-white/60 text-sm leading-[2] mb-5">
              5年後も10年後も、同じ人間関係の悩みを抱えたまま。神社に行くたびに「何かが変わりますように」と祈るだけで、何も変わらないまま歳を重ねていきます。
            </p>
            <div className="border-t border-white/10 pt-5">
              <p
                className="font-serif text-lg text-white"
                style={{ fontFamily: "'Shippori Mincho', serif" }}
              >
                でも——<span className="text-gold">あなたはすでに、最初の一歩を踏んでいます。</span>
              </p>
              <p className="text-white/50 text-sm mt-2 leading-relaxed">
                守護神社診断を受けたこと自体が、縁と向き合う意志の表れです。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 03 — 縁のクセと解決策          */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-washi px-5 py-14 md:py-18">
        <div className="max-w-xl mx-auto">

          <div data-reveal className="mb-7">
            <h2
              className="font-serif text-[1.65rem] md:text-[2.1rem] text-sumi leading-snug"
              style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
            >
              診断結果に、<span className="text-vermilion">答えはもう出ていました。</span>
            </h2>
          </div>

          <div data-reveal data-delay="100" className="space-y-4">
            <P>
              あなたの守護神が示す属性——それは単なる「相性の良い神様」ではありません。あなたがどういう縁を持って生まれてきたか、どういうパターンで人間関係を作る傾向があるかを教えてくれているのです。
            </P>
            <P>
              神道において、神社は「お願いをする場所」ではなく、<strong className="text-sumi">「自分の縁を棚卸しする場所」</strong>です。参拝のあとに少し気持ちが軽くなるのは、縁が動き始めたサインです。
            </P>
            <P>
              ただし、縁を本当に動かすには「在り方」を変える必要があります。どう変えるかは、あなたの縁のクセによって違う。だから、一般的な自己啓発では変わらなかったのです。
            </P>
          </div>

          <blockquote
            data-reveal
            data-delay="200"
            className="mt-8 bg-sumi rounded-xl py-7 px-6"
            style={{ borderLeft: "3px solid #B8373E" }}
          >
            <p
              className="font-serif text-xl text-white leading-[1.85] mb-4"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              縁は、あなたの在り方によって活きもすれば、腐れもする
            </p>
            <footer className="text-white/30 text-xs tracking-[0.3em]">── 日本神道の教え</footer>
          </blockquote>

          <div data-reveal data-delay="260" className="mt-6 bg-gold/8 border border-gold/25 rounded-xl px-6 py-5">
            <p className="text-sm text-sumi/75 leading-[2]">
              この7日間では、あなたの守護神の属性から「縁のクセ」を解き明かし、<strong className="text-sumi">在り方をどう変えればいいか</strong>を具体的にお伝えします。
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 04 — Before / After            */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-white px-5 py-14 md:py-18">
        <div className="max-w-xl mx-auto">

          <div data-reveal className="mb-8">
            <h2
              className="font-serif text-[1.65rem] md:text-[2.1rem] text-sumi leading-snug"
              style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
            >
              縁のクセに気づいた人は、<span className="text-vermilion">何が変わったのか。</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                before: "上司の顔を見るだけで体が強張り、毎日転職サイトを開いていた",
                after: "「在り方」を変えてから半年後、職場の空気が別物になっていた。転職は考えなくなった",
                attr: "40代・会社員女性",
              },
              {
                before: "夫婦の会話が「ご飯どうする？」だけになり、同じ家にいながら孤独だった",
                after: "縁の本質を理解してから、久しぶりに2人で夜中まで話した。あの頃に戻れた気がする",
                attr: "30代・主婦",
              },
              {
                before: "恋愛で必ず同じパターンで終わる。自分のどこが悪いのかずっとわからなかった",
                after: "縁のクセに気づいた瞬間から、初めて「長続きする関係」が始まった",
                attr: "30代・独身女性",
              },
            ].map((c, i) => (
              <div
                key={i}
                data-reveal="up"
                data-delay={String(i * 75)}
                className="rounded-xl overflow-hidden"
                style={{ boxShadow: "0 1px 16px rgba(28,22,19,.07)" }}
              >
                <div className="bg-washi px-5 pt-5 pb-4">
                  <p className="text-[10px] tracking-[0.35em] text-sumi/30 font-semibold mb-2">BEFORE</p>
                  <p className="text-sumi/55 text-sm leading-[1.9]">「{c.before}」</p>
                </div>
                <div className="bg-sumi px-5 pt-4 pb-5">
                  <p className="text-[10px] tracking-[0.35em] font-semibold mb-2" style={{ color: "#06C755" }}>AFTER</p>
                  <p className="text-white text-sm leading-[1.9]">「{c.after}」</p>
                  <p className="text-white/25 text-[10px] mt-3 tracking-widest">{c.attr}</p>
                </div>
              </div>
            ))}
          </div>

          <p data-reveal className="text-sumi/25 text-xs text-center mt-5">
            ※ 個人の体験をもとにした参考事例です。効果には個人差があります。
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* CTA — 7日間の中身                      */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-sumi px-5 py-16 md:py-20">
        <div className="max-w-lg mx-auto">

          <div data-reveal className="mb-8 text-center">
            <p className="text-[10px] tracking-[0.5em] text-gold/50 font-medium mb-4">7日間・完全無料</p>
            <h2
              className="font-serif text-[1.85rem] md:text-[2.4rem] text-white leading-snug mb-4"
              style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
            >
              あなたの縁のクセを解き明かす、<span className="text-gold">7日間のコンテンツ。</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed">
              守護神社診断の結果をもとに、あなたの人間関係が変わらない本当の理由と、変えるための具体的な方法をお届けします。
            </p>
          </div>

          <div data-reveal data-delay="80" className="space-y-0 mb-8 divide-y divide-white/6">
            {[
              { day: "Day 1", text: "あなたの守護神が示す「縁のクセ」——なぜ同じパターンが繰り返されるのか" },
              { day: "Day 2", text: "職場の人間関係が詰まる、見えないひとつのパターン" },
              { day: "Day 3", text: "夫婦・家族の縁が静かに冷えていく、気づかれにくい原因" },
              { day: "Day 4", text: "恋愛で同じ結末を繰り返す人に共通している、縁のクセの正体" },
              { day: "Day 5", text: "日本人が失った「縁の整え方」——神道が本来伝えていたこと" },
              { day: "Day 6", text: "在り方を変えると、周囲はどう変わるのか。具体的な話" },
              { day: "Day 7", text: "あなたの守護神から届く、これからの縁へのメッセージ" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 py-4">
                <span
                  className="text-[10px] font-bold tracking-widest flex-shrink-0 pt-0.5 w-11"
                  style={{ color: "#B8932C" }}
                >
                  {item.day}
                </span>
                <p className="text-white/70 text-[14px] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div data-reveal data-delay="160" className="border-t border-white/8 pt-8 text-center space-y-4">
            <p
              className="font-serif text-lg text-white/85"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              守護神社診断を受けたあなたにだけ、<br className="hidden md:inline" />届けられるコンテンツです。
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              登録後すぐにDay 1が届きます。すべて無料。
            </p>
            <div className="pt-1">
              <LineBtn lg />
            </div>
            <p className="text-white/20 text-[11px] tracking-wide">
              登録無料・いつでもブロック解除できます・勧誘は一切しません
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* FAQ                                    */}
      {/* ═══════════════════════════════════════ */}
      <section className="bg-white px-5 py-14">
        <div className="max-w-xl mx-auto">

          <div data-reveal className="mb-7">
            <h3
              className="font-serif text-xl text-sumi"
              style={{ fontFamily: "'Shippori Mincho', serif", letterSpacing: "0.03em" }}
            >
              よくある質問
            </h3>
            <div className="w-8 h-px bg-gold/40 mt-3" />
          </div>

          <div className="divide-y divide-sumi/6">
            {[
              {
                q: "宗教的な勧誘ではないですか？",
                a: "いいえ。特定の宗教への勧誘は一切行っていません。神道の精神性をベースにした、人間関係・生き方のコンテンツです。",
              },
              {
                q: "登録後に費用はかかりますか？",
                a: "LINE登録・7日間のコンテンツはすべて無料です。有料のご案内をする場合は、必ず事前にお伝えします。",
              },
              {
                q: "神社に詳しくなくても大丈夫ですか？",
                a: "はい。人間関係に悩んでいる方であれば、どなたでもお役立ていただける内容です。",
              },
              {
                q: "配信を止めたいときは？",
                a: "LINEのブロック機能でいつでも解除できます。一切引き止めません。",
              },
            ].map((faq, i) => (
              <details key={i} data-reveal data-delay={String(i * 50)} className="group py-1">
                <summary className="cursor-pointer py-4 text-sm font-medium text-sumi flex items-center justify-between gap-3 list-none select-none">
                  <span>Q. {faq.q}</span>
                  <span className="text-gold/60 text-xs group-open:rotate-180 transition-transform duration-300 flex-shrink-0">▼</span>
                </summary>
                <p className="pb-5 text-sm text-sumi/60 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>

          <div data-reveal className="mt-12 text-center space-y-4 pt-10 border-t border-gold/15">
            <p
              className="font-serif text-lg text-sumi/60"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              まず、7日間だけ受け取ってみてください。
            </p>
            <LineBtn lg={false} />
            <p className="text-sumi/25 text-xs">登録後すぐにDay 1をお届けします</p>
          </div>

          <div className="mt-10 pt-7 text-center text-xs text-sumi/25 space-y-2 border-t border-sumi/6">
            <p>
              このページは
              <Link href="/" className="underline underline-offset-2 mx-1 hover:text-sumi/50 transition-colors">全国神社スポット</Link>
              と連携したコンテンツです。
            </p>
            <p>
              <Link href="/diagnose" className="underline underline-offset-2 mr-4 hover:text-sumi/50 transition-colors">守護神社診断を受ける</Link>
              <Link href="/map" className="underline underline-offset-2 hover:text-sumi/50 transition-colors">神社マップを見る</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
