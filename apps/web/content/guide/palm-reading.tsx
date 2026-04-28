import { KeyPoint, CtaBox } from "@/components/guide";
import Link from "next/link";

function LineCard({
  num, name, rating, summary, good, caution,
  bg, badge, numBg,
}: {
  num: number; name: string; rating: string; summary: string;
  good: string; caution: string;
  bg: string; badge: string; numBg: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${numBg}`}>{num}</span>
          <span className="font-bold text-stone-800 text-base">{name}</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>{rating}</span>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed mb-3">{summary}</p>
      <div className="space-y-1.5 border-t border-stone-200/60 pt-3">
        <p className="text-sm text-stone-600"><span className="text-amber-500 mr-1.5 font-bold">✦</span>{good}</p>
        <p className="text-sm text-stone-500"><span className="text-stone-400 mr-1.5">▲</span>{caution}</p>
      </div>
    </div>
  );
}

function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-2">
      <p className="font-bold text-stone-800 text-sm leading-snug">{q}</p>
      <p className="text-sm text-stone-600 leading-relaxed">{a}</p>
    </div>
  );
}

export default function PalmReadingContent() {
  return (
    <>
      <h2>手のひらに、あなたの人生が描かれている</h2>

      <p>
        生命線・知能線・感情線・運命線——4本の線は、胎児のころから形成される「魂の地図」です。熟練した鑑定士が読んでいたものを、AIがスマホ1枚で再現します。
      </p>

      {/* ヒーロー画像：実際の手相写真 */}
      <div className="my-8 overflow-hidden rounded-2xl shadow-lg">
        <img
          src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&q=80"
          alt="手相の線が見える手のひら"
          className="w-full object-cover"
        />
        <p className="bg-stone-100 px-4 py-2 text-center text-xs text-stone-500">
          手のひらの主要な4本の線から性質・才能・縁の傾向を読み取ります
        </p>
      </div>

      <hr />

      <h2>AIが読み解く4つの線</h2>

      <div className="my-6 space-y-3">
        <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-400 text-sm font-bold text-white">1</span>
          <div>
            <p className="font-bold text-stone-800 mb-1">生命線 <span className="text-xs font-normal text-red-600 ml-1">— 生命力・体力・人生の充実度</span></p>
            <p className="text-sm text-stone-600 leading-relaxed">親指の付け根から手首へ伸びる曲線。長さより深さと質が重要で、「短い＝短命」は俗説です。</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-400 text-sm font-bold text-white">2</span>
          <div>
            <p className="font-bold text-stone-800 mb-1">知能線 <span className="text-xs font-normal text-blue-600 ml-1">— 思考力・判断力・才能の方向性</span></p>
            <p className="text-sm text-stone-600 leading-relaxed">人差し指と親指の間から横方向へ伸びる線。長いほど熟考型、短いほど直感行動型の傾向。</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white">3</span>
          <div>
            <p className="font-bold text-stone-800 mb-1">感情線 <span className="text-xs font-normal text-amber-700 ml-1">— 感受性・対人関係・愛情の深さ</span></p>
            <p className="text-sm text-stone-600 leading-relaxed">小指側から人差し指方向への横線。長く深いほど感受性が高く、人との縁を大切にする傾向。</p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">4</span>
          <div>
            <p className="font-bold text-stone-800 mb-1">運命線 <span className="text-xs font-normal text-green-700 ml-1">— 使命感・社会的成功・人生の方向性</span></p>
            <p className="text-sm text-stone-600 leading-relaxed">手首中央から中指へ縦に伸びる線。後天的に変化しやすく、努力と生き方が最も反映される線です。</p>
          </div>
        </div>
      </div>

      <KeyPoint title="手相は変わる">
        手相は生涯固定ではありません。生き方・考え方・経験によって変化します。特に運命線は努力の変化が最も反映されやすい線です。
      </KeyPoint>

      <hr />

      <h2>鑑定結果のサンプル</h2>

      <p>
        手のひらの写真を送ると、こんな形で鑑定結果が届きます。
      </p>

      {/* サンプル：実際の手相写真 + 診断結果 */}
      <div className="my-8 overflow-hidden rounded-2xl border border-stone-200 shadow-lg bg-white">

        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-stone-800 to-stone-700 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/40 mb-0.5">SAMPLE RESULT</p>
            <p className="font-serif text-lg text-white leading-tight">手相鑑定レポート</p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">AI鑑定済み</span>
        </div>

        {/* 手相写真（サンプル） */}
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800&q=80"
            alt="手相鑑定サンプル"
            className="w-full object-cover max-h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute bottom-3 left-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            ✦ AIが線を自動検出
          </span>
          <span className="absolute top-3 right-3 rounded-full bg-stone-900/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur-sm">
            SAMPLE
          </span>
        </div>

        {/* 各線の結果 */}
        <div className="p-5 space-y-3">
          <p className="text-[10px] tracking-[0.3em] text-stone-400 font-bold">— 4本の線の鑑定結果</p>
          <LineCard
            num={1} name="生命線" rating="やや良好"
            summary="なめらかで基礎体力と粘り強さを示す手相。無理を重ねるより、休みながら力を出すタイプです。"
            good="持久力・回復力が育てやすい"
            caution="疲れを溜めると調子が乱れやすい"
            bg="bg-red-50 border-red-200" badge="bg-red-100 text-red-700" numBg="bg-red-400"
          />
          <LineCard
            num={2} name="知能線" rating="良好"
            summary="比較的長く、現実感覚と慎重さがある傾向。考えてから行動すると力を発揮しやすいタイプです。"
            good="判断が堅実で考えを形にしやすい"
            caution="考えすぎて動き出しが遅くなることも"
            bg="bg-blue-50 border-blue-200" badge="bg-blue-100 text-blue-700" numBg="bg-blue-400"
          />
          <LineCard
            num={3} name="感情線" rating="やや繊細"
            summary="穏やかで対人面ではやさしさと気配りが出やすい印象。感受性が高く、人に合わせすぎると疲れやすい面も。"
            good="思いやりがあり人の気持ちを汲みやすい"
            caution="気疲れしやすく抱え込みやすい"
            bg="bg-amber-50 border-amber-200" badge="bg-amber-100 text-amber-700" numBg="bg-amber-400"
          />
          <LineCard
            num={4} name="運命線" rating="発展途上"
            summary="控えめながら見える運命線。積み重ねの中で方向性が固まるタイプで、経験を積むほど安定します。"
            good="経験を積むほど運が安定しやすい"
            caution="迷う時期は流れが弱く見えやすい"
            bg="bg-green-50 border-green-200" badge="bg-green-100 text-green-700" numBg="bg-green-500"
          />
        </div>

        {/* 総合鑑定 */}
        <div className="mx-5 mb-4 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 p-5">
          <p className="text-[10px] tracking-[0.2em] text-stone-500 font-bold mb-3">✦ 総合鑑定</p>
          <p className="font-serif text-xl text-stone-800 mb-3 leading-snug">
            繊細さとバランス感覚を持つ、<br />育てて伸びる手相
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">
            やさしさ・慎重さ・継続力がバランスよく出ています。勢いより積み重ねを大切にするほど、運の流れが安定していきます。
          </p>
        </div>

        {/* 開運ヒント */}
        <div className="mx-5 mb-4 rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-[10px] tracking-[0.2em] text-stone-400 font-bold mb-3">🗝 開運ヒント</p>
          <ul className="space-y-2.5">
            {[["📅", "休む日を先に決める"], ["📝", "考えたことを小さく行動に移す"], ["🤝", "人に合わせすぎず境界線を持つ"]].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-sm text-stone-700">
                <span className="text-base">{icon}</span>{text}
              </li>
            ))}
          </ul>
        </div>

        {/* 神社アドバイス */}
        <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] tracking-[0.2em] text-emerald-700 font-bold mb-2">⛩ 神社参拝アドバイス</p>
          <p className="text-sm text-stone-700 leading-relaxed">
            水属性・弁財天系の神社との縁が深い手相です。厳島神社・江島神社への参拝が特に力をもたらします。
          </p>
        </div>

        <p className="text-center text-[10px] text-stone-400 pb-4">
          ※サンプルです。実際の鑑定はあなたの手相に合わせて生成されます
        </p>
      </div>

      <hr />

      <h2>3ステップで完了</h2>

      <div className="my-6 space-y-3">
        {[
          { step: "1", title: "手のひらを撮影", desc: "明るい場所で手を広げ、指先から手首まで全体を撮影します。" },
          { step: "2", title: "写真をアップロード", desc: "撮影した写真を鑑定ページに送るだけ。JPG・PNG・HEIC対応。" },
          { step: "3", title: "20〜40秒で結果が届く", desc: "4本の線の評価・総合鑑定・開運ヒント・神社参拝アドバイスが生成されます。" },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex gap-4 items-start rounded-xl border border-stone-200 bg-white p-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vermilion text-sm font-bold text-white">{step}</span>
            <div>
              <p className="font-bold text-stone-800 mb-1">{title}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <hr />

      <h2>きれいに撮るコツ</h2>

      <div className="my-6 overflow-hidden rounded-2xl shadow-md">
        <img
          src="https://images.unsplash.com/photo-1597589827317-4c6d6e0a90bd?w=1200&q=80"
          alt="手のひらを広げた写真"
          className="w-full object-cover max-h-72"
        />
        <p className="bg-stone-100 px-4 py-2 text-center text-xs text-stone-500">
          指を自然に広げ、手全体がフレームに入るように撮影するのがポイント
        </p>
      </div>

      <div className="my-6 space-y-2.5">
        {[
          ["自然光の場所で撮る", "窓際や屋外が最適。暗い部屋や逆光は避けてください"],
          ["手のひら全体を収める", "指先から手首まで、フレームに収まるように"],
          ["指を自然に広げる", "力を入れすぎず、リラックスした状態で"],
          ["カメラとの距離20〜30cm", "近すぎても遠すぎても線が見えにくくなります"],
          ["右手でも左手でも可", "右手＝現在・未来、左手＝生まれ持った素質"],
        ].map(([title, desc]) => (
          <div key={title} className="flex items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3.5">
            <span className="text-vermilion font-bold text-sm mt-0.5">✓</span>
            <div>
              <span className="font-semibold text-stone-800 text-sm">{title}</span>
              <span className="text-stone-500 text-sm ml-2">— {desc}</span>
            </div>
          </div>
        ))}
      </div>

      <KeyPoint title="右手と左手の違い">
        右手が「後天的な現在・未来」、左手が「先天的な本質・素質」とされています。今の状態を知りたいなら右手、生まれ持った才能を知りたいなら左手がおすすめです。
      </KeyPoint>

      <hr />

      <h2>手相と神道</h2>

      <p>
        神社の参拝作法「二礼二拍手一礼」の拍手（かしわで）は、両手を合わせることで神様と共鳴するとされる行為です。手は古来から「神様に触れる部位」として特別な意味を持っていました。
      </p>
      <p>
        手のひらに刻まれた線を「魂の刻印」と捉えると、手相鑑定は占いを超えた「本当の自分を知るための内省ツール」になります。
      </p>

      <hr />

      <h2>よくある質問</h2>

      <div className="my-6 space-y-3">
        <FaqCard
          q="AI鑑定の精度はどのくらい？"
          a="GPT-4o（最新AI）が手相専門知識をもとに画像を解析します。写真が鮮明であれば熟練鑑定士に近いレベルの読み取りが可能です。ただし占いは参考情報であり、医学的診断ではありません。"
        />
        <FaqCard
          q="写真のプライバシーは守られる？"
          a="アップロードした手相写真は鑑定にのみ使用し、保存・第三者提供は行いません。顔や個人情報が写らないようにして撮影してください。"
        />
        <FaqCard
          q="無料で何回使える？"
          a="端末あたり3回まで無料です。LINE登録でさらに3回分を追加プレゼントしています。"
        />
        <FaqCard
          q="線が薄くて見えにくい場合は？"
          a="薄い手相の場合、AIが「控えめ」「発展途上」という形で読み取ります。撮影場所を明るくすることで精度が上がります。"
        />
        <FaqCard
          q="右手と左手どちらを撮ればいい？"
          a="どちらでも鑑定できます。今の自分・変えたい方向を知りたいなら右手、本来の素質を知りたいなら左手がおすすめです。"
        />
      </div>

      {/* CTA */}
      <div className="my-10 rounded-2xl border-2 border-vermilion/30 bg-gradient-to-br from-vermilion/8 to-washi p-7 text-center">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">無料3回</p>
        <h3 className="font-serif text-2xl text-sumi mb-3">あなたの手相を鑑定してみる</h3>
        <p className="text-sm text-sumi/65 mb-6 leading-relaxed">
          写真1枚で、4本の線の評価・総合鑑定・神社参拝アドバイスが届きます。
        </p>
        <Link
          href="/palm"
          className="inline-flex items-center gap-2 rounded-full bg-vermilion px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-vermilion/90 active:scale-95"
        >
          ✋ 手相鑑定を試してみる（無料）
        </Link>
      </div>

      <CtaBox
        title="毎週、守護神様からの言葉をLINEで受け取る"
        body="あなたの手相タイプに合わせた守護神からのメッセージ・今月の吉日・参拝アドバイスを毎週LINEでお届けします。"
        href="https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql"
        label="LINEで無料登録する"
        variant="line"
      />
    </>
  );
}
