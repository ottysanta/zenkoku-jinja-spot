import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ANALYSIS_PROMPT = `あなたは日本の熟練した手相鑑定士です。
送られてきた手のひらの写真を丁寧に観察し、以下のJSON形式で鑑定結果を返してください。

【重要】まず右手か左手かを正確に判断してください。
- 右手の場合：親指は画像の左側（または右側）にある
- 左手の場合：親指は画像の右側（または左側）にある
- 手相の線の位置は手の向きに基づいて正確に特定してください

各線の正確な位置：
- 生命線：親指の付け根と人差し指の付け根の間から始まり、手首に向かって弧を描く曲線（手のひらの中央部〜親指側を通る）
- 知能線：生命線の始点付近から始まり、手のひらを横切って小指側へ向かう線
- 感情線：小指の付け根下から人差し指方向へ横切る最も上部の横線
- 運命線：手首中央から中指の付け根に向かう縦線（ない場合もある）

手が写っていれば暗くてもぼやけていても is_valid: true として鑑定してください。

{
  "is_valid": true,
  "hand": "右手 | 左手",
  "lines": {
    "life": {
      "rating": "良好 | やや良好 | 普通 | やや注意 | 注意",
      "summary": "生命線の特徴を1〜2文で",
      "good": "良い点を1文で",
      "caution": "注意点を1文で"
    },
    "head": {
      "rating": "良好 | やや良好 | 普通 | やや注意 | 注意",
      "summary": "知能線の特徴を1〜2文で",
      "good": "良い点を1文で",
      "caution": "注意点を1文で"
    },
    "heart": {
      "rating": "良好 | やや良好 | 普通 | やや注意 | 注意",
      "summary": "感情線の特徴を1〜2文で",
      "good": "良い点を1文で",
      "caution": "注意点を1文で"
    },
    "fate": {
      "rating": "良好 | やや良好 | 普通 | やや注意 | 注意",
      "summary": "運命線の特徴を1〜2文で（見えない場合は「控えめで安定志向」と表現）",
      "good": "良い点を1文で",
      "caution": "注意点を1文で"
    }
  },
  "overall": {
    "headline": "総合鑑定を表すキャッチコピー（15〜25文字）",
    "body": "総合的な鑑定コメント（80〜120文字）"
  },
  "hints": [
    "開運ヒント1（10〜20文字）",
    "開運ヒント2",
    "開運ヒント3"
  ],
  "shrine_advice": "この手相の方に合う神社参拝のアドバイス（50〜80文字）"
}

JSONのみ返してください。説明文は不要です。`;

const ANNOTATE_PROMPT = `この手のひらの写真に、手相鑑定ガイドのような美しい線のオーバーレイを追加してください。

右手か左手かを正確に判断し、各線を手のひらの実際の位置に正確に描いてください：
① 生命線（赤色）：親指と人差し指の間から始まり手首へ向かう弧線。手のひら内側を通る。手の外側には描かない。
② 知能線（青色）：生命線の起点付近から始まり、手のひら中央を横切る線
③ 感情線（金色）：手のひら上部を横切る最も上の横線（小指下〜人差し指方向）
④ 運命線（緑色）：手首中央から中指へ向かう縦線（薄く見えない場合は描かなくてよい）

スタイル：
- 線は半透明の滑らかな曲線で、手のひらの上にのみ描く（手の輪郭の外には絶対に描かない）
- 各線の端に小さな丸い番号ラベル（①②③④）を白背景で付ける
- 元の手の写真はそのまま保持し、線のみをオーバーレイとして追加
- 全体的に清潔感のある鑑定ガイド風の仕上がりにする`;

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 });
    }

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "画像は10MB以下にしてください" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Step 1: GPT-4oで手相テキスト分析
    const analysisRes = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high",
              },
            },
            { type: "text", text: ANALYSIS_PROMPT },
          ],
        },
      ],
    });

    const rawText = analysisRes.choices[0]?.message?.content ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "鑑定結果の解析に失敗しました" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // is_valid チェックは行わず常に鑑定結果を返す

    // Step 2: GPT Image 2で線描き込み
    let annotatedImageUrl: string | null = null;
    try {
      const imageFile = new File([buffer], file.name || "palm.jpg", { type: mimeType });
      const editRes = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: ANNOTATE_PROMPT,
        n: 1,
        size: "1024x1024",
      });

      const b64 = editRes.data?.[0]?.b64_json;
      if (b64) {
        annotatedImageUrl = `data:image/png;base64,${b64}`;
      }
    } catch (imgErr) {
      // 画像生成失敗しても分析結果は返す
      console.error("Image annotation failed:", imgErr);
    }

    return NextResponse.json({
      analysis,
      annotatedImageUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Palm API error:", msg);
    // API キー未設定の場合は分かりやすいメッセージを返す
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY が設定されていません" }, { status: 500 });
    }
    return NextResponse.json({ error: `鑑定中にエラーが発生しました: ${msg}` }, { status: 500 });
  }
}
