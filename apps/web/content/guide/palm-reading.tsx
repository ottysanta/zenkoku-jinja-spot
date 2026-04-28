import { GuideImage, KeyPoint, CtaBox } from "@/components/guide";
import Link from "next/link";

function SampleLineCard({
  num, name, rating, summary, good, caution,
  bg, badge, numBg,
}: {
  num: number; name: string; rating: string; summary: string;
  good: string; caution: string;
  bg: string; badge: string; numBg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${numBg}`}>{num}</span>
          <span className="font-bold text-stone-800">{name}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge}`}>評価：{rating}</span>
      </div>
      <p className="text-xs text-stone-600 leading-relaxed mb-2">{summary}</p>
      <div className="space-y-1">
        <p className="text-[11px] text-stone-500"><span className="text-amber-500 mr-1">✦</span>良い点：{good}</p>
        <p className="text-[11px] text-stone-500"><span className="text-stone-400 mr-1">▲</span>注意点：{caution}</p>
      </div>
    </div>
  );
}

export default function PalmReadingContent() {
  return (
    <>
      <h2>あなたの手のひらに、人生の地図が描かれている</h2>

      <p>
        手相は、あなたが生まれ持った気質・才能・縁の傾向を手のひらの線から読み取る、数千年の歴史を持つ占術です。
      </p>
      <p>
        生命線・知能線・感情線・運命線——これらの線は、医学的には「掌紋」と呼ばれ、胎児のころから形成されます。手相鑑定は、その線の長さ・深さ・形状から「その人がどういう人物か」「どんな縁を持っているか」「どんな可能性を秘めているか」を読み解くものです。
      </p>
      <p>
        本来、熟練した鑑定士に頼む必要があった手相鑑定を、AIの力を使って誰でも・いつでも・スマホ1台で体験できるようにしたのが、このサービスです。
      </p>

      <GuideImage
        src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80"
        alt="手のひら"
        caption="手のひらに刻まれた線。それはあなたの魂の地図"
      />

      <hr />

      <h2>AIが読み解く4つの主要な線</h2>

      <p>
        このサービスでは、手相の中でも最も重要な4本の線を中心に鑑定します。
      </p>

      {/* 4線の説明 */}
      <div className="my-6 space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-400 text-sm font-bold text-white">1</span>
            <h3 className="text-base font-bold text-stone-800 m-0">生命線</h3>
            <span className="text-xs text-red-600 font-medium">— 生命力・体力・人生の充実度</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            親指の付け根から手首へ向かう曲線。長さ・太さ・深さから、基礎体力・生命エネルギー・人生の転換点を読み取ります。「短いと短命」というのは俗説で、実際には質と深さが重要です。
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-sm font-bold text-white">2</span>
            <h3 className="text-base font-bold text-stone-800 m-0">知能線</h3>
            <span className="text-xs text-blue-600 font-medium">— 思考力・判断力・才能の方向性</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            人差し指と親指の間から手のひら横方向へ伸びる線。長さや傾きから思考のタイプ（論理的・直感的・創造的）や才能の方向性がわかります。知能線が長い人は熟考型、短い人は直感行動型が多いとされます。
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white">3</span>
            <h3 className="text-base font-bold text-stone-800 m-0">感情線</h3>
            <span className="text-xs text-amber-700 font-medium">— 感受性・対人関係・愛情の深さ</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            小指側から人差し指方向へ伸びる横線。感情の豊かさ・対人関係のスタイル・愛情表現の仕方を示します。感情線が長く深い人は感受性が高く、人との絆を大切にする傾向があります。
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">4</span>
            <h3 className="text-base font-bold text-stone-800 m-0">運命線</h3>
            <span className="text-xs text-green-700 font-medium">— 使命感・社会的成功・人生の方向性</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            手首中央から中指へ向かう縦線。はっきり出ている人は目標が明確で意志が強く、薄い・途切れている人は自分のペースで道を積み上げていくタイプとされます。運命線は後天的に変化しやすい線でもあります。
          </p>
        </div>
      </div>

      <KeyPoint title="手相は変わる">
        手相は生涯固定ではありません。生き方・考え方・経験によって少しずつ変化します。特に運命線は努力と生き方の変化が最も反映されやすい線です。定期的に鑑定することで、自分の成長を手のひらで確認できます。
      </KeyPoint>

      <hr />

      <h2>実際の鑑定結果はこんな感じです</h2>

      <p>
        手のひらの写真を送ると、AIが約20〜40秒で以下のような鑑定結果を生成します。
      </p>

      {/* サンプル結果 */}
      <div className="my-8 rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-stone-800 to-stone-700 p-4 text-center">
          <p className="text-[10px] tracking-[0.3em] text-white/50 mb-1">SAMPLE RESULT</p>
          <p className="font-serif text-lg text-white">手相鑑定ガイド</p>
          <p className="text-xs text-white/60">この手のひらから見る性質・傾向</p>
        </div>

        {/* サンプル：各線 */}
        <div className="p-5 space-y-3">
          <p className="text-[10px] tracking-[0.3em] text-stone-400 font-bold mb-4">主要な線の見方</p>
          <SampleLineCard
            num={1} name="生命線" rating="やや良好"
            summary="生命線はなめらかで基礎体力と粘り強さを表しやすい手相です。無理を重ねるより、休みながら力を出すタイプ。"
            good="持久力・回復力を育てやすい"
            caution="疲れを溜めると調子がぶれやすい"
            bg="bg-red-50 border-red-200" badge="bg-red-100 text-red-700" numBg="bg-red-400"
          />
          <SampleLineCard
            num={2} name="知能線" rating="良好"
            summary="知能線は比較的長く、現実感覚と慎重さがある傾向。勢いだけで動くより、考えてから行動すると力を発揮しやすいタイプです。"
            good="判断が堅実で、考えを形にしやすい"
            caution="考えすぎて動き出しが遅くなることも"
            bg="bg-blue-50 border-blue-200" badge="bg-blue-100 text-blue-700" numBg="bg-blue-400"
          />
          <SampleLineCard
            num={3} name="感情線" rating="やや繊細"
            summary="感情線は穏やかで、対人面ではやさしさや気配りが出やすい印象。感受性が高いため、人に合わせすぎると疲れやすい面もあります。"
            good="思いやりがあり、人の気持ちを汲みやすい"
            caution="気疲れしやすく、抱え込みやすい"
            bg="bg-amber-50 border-amber-200" badge="bg-amber-100 text-amber-700" numBg="bg-amber-400"
          />
          <SampleLineCard
            num={4} name="運命線" rating="発展途上"
            summary="運命線は控えめながら見え、自分の意思や経験によって進路が育っていくタイプ。最初から一直線に決まるより、積み重ねの中で方向性が固まりやすい傾向です。"
            good="経験を積むほど安定しやすい"
            caution="迷う時期は流れが弱く見えやすい"
            bg="bg-green-50 border-green-200" badge="bg-green-100 text-green-700" numBg="bg-green-500"
          />
        </div>

        {/* サンプル：総合鑑定 */}
        <div className="mx-5 mb-5 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500">✦</span>
            <p className="text-[10px] tracking-[0.2em] text-stone-500 font-bold">総合鑑定結果</p>
          </div>
          <p className="font-serif text-xl text-stone-800 mb-3 leading-snug">
            繊細さとバランス感覚を併せ持つ、<br />育てて伸びる手相です。
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">
            やさしさ、慎重さ、継続力がバランスよく出ています。勢いで突き進むよりも、少しずつ積み重ねるほど魅力と運の流れが安定していくタイプ。自分のペースを守り、無理をしすぎないことが開運の鍵です。
          </p>
        </div>

        {/* サンプル：開運ヒント */}
        <div className="mx-5 mb-5 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <span>🗝</span>
            <p className="text-[10px] tracking-[0.2em] text-stone-400 font-bold">開運ヒント</p>
          </div>
          <ul className="space-y-2">
            {[["📅", "休む日を先に決める"], ["📝", "考えたことを小さく行動に移す"], ["🤝", "人に合わせすぎず境界線を持つ"]].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-stone-600">
                <span className="text-base">{icon}</span>{text}
              </li>
            ))}
          </ul>
        </div>

        {/* サンプル：神社アドバイス */}
        <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] tracking-[0.2em] text-emerald-700 font-bold mb-2">⛩ 神社参拝アドバイス</p>
          <p className="text-sm text-stone-600 leading-relaxed">
            水属性・弁財天系の神社との縁が深い手相です。感受性を整えたいとき、厳島神社・江島神社への参拝が特に力をもたらします。「今の自分を整えます」という宣言の参拝が最も効果的です。
          </p>
        </div>

        <p className="text-center text-[10px] text-stone-400 pb-4">
          ※これはサンプルです。実際の鑑定はあなたの手相に合わせて生成されます
        </p>
      </div>

      <hr />

      <h2>鑑定の流れ——3ステップで完了</h2>

      <div className="my-6 space-y-4">
        {[
          { step: "1", title: "手のひらを撮影する", desc: "手を広げ、明るい場所で手のひら全体がはっきり写るように撮影します。ピントが合っていると鑑定精度が上がります。" },
          { step: "2", title: "写真をアップロードする", desc: "撮影した写真を鑑定ページにアップロードするだけ。JPG・PNG・HEICすべて対応しています。" },
          { step: "3", title: "20〜40秒で結果が届く", desc: "AIが手相を解析し、4本の線の評価・総合鑑定・開運ヒント・神社参拝アドバイスを生成します。" },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex gap-4 items-start">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vermilion text-sm font-bold text-white">{step}</span>
            <div>
              <p className="font-bold text-stone-800 mb-1">{title}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <hr />

      <h2>きれいに撮るコツ——精度を上げるために</h2>

      <GuideImage
        src="https://images.unsplash.com/photo-1576595580361-90a855b84b20?w=1200&q=80"
        alt="手のひらを広げた写真"
        caption="指を自然に広げ、手全体が見えるように撮影するのがポイント"
      />

      <ul>
        <li><strong>明るい場所で撮る</strong> — 自然光が最も線をはっきり写します。暗い部屋や逆光は避けましょう</li>
        <li><strong>手のひら全体を収める</strong> — 指先から手首まで、フレームに収まるように</li>
        <li><strong>指を自然に広げる</strong> — 力を入れすぎず、リラックスした状態で</li>
        <li><strong>カメラとの距離は20〜30cm</strong> — 近すぎても遠すぎても線が見えにくくなります</li>
        <li><strong>右手と左手どちらでも可</strong> — 右手は現在・未来、左手は生まれ持った素質を読むとされます</li>
      </ul>

      <KeyPoint title="右手と左手の違い">
        手相鑑定では一般的に「右手が後天的な現在・未来」「左手が先天的な本質・素質」とされています。今の自分の状態を知りたい方は右手、生まれ持った才能や本質を知りたい方は左手の鑑定がおすすめです。
      </KeyPoint>

      <hr />

      <h2>手相と神道——手のひらに宿る神様の意志</h2>

      <p>
        古来より日本では、手は「神様に触れる部位」として特別な意味を持っていました。
      </p>
      <p>
        神社でのお参りの作法「二礼二拍手一礼」における拍手（かしわで）は、両手を合わせることで神様と人間が共鳴するとされています。手を打つことで「自分はここにいます」という存在を神様に知らせる行為でもあります。
      </p>
      <p>
        手相は、そのような神聖な部位に刻まれた「魂の刻印」と解釈することもできます。あなたの手のひらに刻まれた線は、生まれる前から持っていた魂の方向性の地図——そう捉えると、手相鑑定は単なる占いではなく「本当の自分を知るための内省の道具」になります。
      </p>

      <hr />

      <h2>よくある質問</h2>

      <h3>Q. AIの鑑定精度はどのくらいですか？</h3>
      <p>
        GPT-4o（最新のAI）が手相鑑定の専門知識を学習した上で画像を解析します。写真が鮮明であれば、熟練の鑑定士に近いレベルの読み取りが可能です。ただし、占いは参考情報であり、医学的診断ではありません。
      </p>

      <h3>Q. 写真のプライバシーは守られますか？</h3>
      <p>
        アップロードした手相写真は鑑定にのみ使用され、保存・第三者提供はしません。OpenAIのAPIを経由して処理されます。プライバシーが気になる方は、顔や個人を特定できる情報が写らないようにしてください。
      </p>

      <h3>Q. 無料で何回使えますか？</h3>
      <p>
        端末あたり3回まで無料でご利用いただけます。LINE登録をいただいた方には、さらに3回分を追加プレゼントしています。
      </p>

      <h3>Q. 線が薄くて見えにくい場合はどうなりますか？</h3>
      <p>
        線が薄い手相の場合、AIが「控えめ」「発展途上」という形で読み取ります。手相の線が薄いこと自体も性格や傾向を示しており、それも鑑定に反映されます。撮影環境を明るくすることで読み取り精度が上がります。
      </p>

      <h3>Q. 右手と左手、どちらを撮ればいいですか？</h3>
      <p>
        どちらでも鑑定できます。一般的に右手が「現在・未来・後天的な運」、左手が「生まれ持った素質・先天的な才能」を示すとされます。気になる方・変えたい方は右手、本来の自分を知りたい方は左手がおすすめです。
      </p>

      {/* CTA */}
      <div className="my-10 rounded-2xl border-2 border-vermilion/30 bg-gradient-to-br from-vermilion/8 to-washi p-6 text-center">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">無料3回</p>
        <h3 className="font-serif text-xl text-sumi mb-3">あなたの手相を鑑定してみる</h3>
        <p className="text-sm text-sumi/65 mb-5 leading-relaxed">
          手のひらの写真1枚で、生命線・知能線・感情線・運命線を<br className="hidden sm:block" />AIが詳細に鑑定。神社参拝アドバイス付き。
        </p>
        <Link
          href="/palm"
          className="inline-flex items-center gap-2 rounded-full bg-vermilion px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-vermilion/90 active:scale-95"
        >
          ✋ 手相鑑定を試してみる（無料）
        </Link>
      </div>

      <CtaBox
        title="毎週、守護神様からの言葉をLINEで受け取る"
        body="あなたの属性・手相のタイプに合わせた守護神からのメッセージ・今月の吉日・参拝アドバイスを毎週LINEでお届けします。"
        href="https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql"
        label="LINEで無料登録する"
        variant="line"
      />
    </>
  );
}
