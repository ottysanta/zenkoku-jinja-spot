import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ANALYSIS_PROMPT = `あなたは日本の熟練した手相鑑定士です。
送られてきた手のひらの写真を丁寧に観察し、以下のJSON形式で鑑定結果を返してください。

手のひらが全く写っていない・明らかに手ではない画像の場合のみ is_valid: false を返してください。
少し暗い・ぼやけている程度であれば is_valid: true として、見える範囲で最善の鑑定を行ってください。

{
  "is_valid": true,
  "lines": {
    "life": {
      "rating": "良好 | やや良好 | 普通 | 注意 | やや注意",
      "summary": "生命線の特徴を1〜2文で",
      "good": "良い点を1文で",
      "caution": "注意点を1文で"
    },
    "head": {
      "rating": "...",
      "summary": "知能線の特徴を1〜2文で",
      "good": "...",
      "caution": "..."
    },
    "heart": {
      "rating": "...",
      "summary": "感情線の特徴を1〜2文で",
      "good": "...",
      "caution": "..."
    },
    "fate": {
      "rating": "...",
      "summary": "運命線の特徴を1〜2文で（見えない場合は「控えめ」と表現）",
      "good": "...",
      "caution": "..."
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

const ANNOTATE_PROMPT = `この手のひらの写真に、手相の主要な線を美しく描き込んでください。
- 生命線（親指の付け根から手首へ向かう曲線）: 赤〜ピンク色の曲線
- 知能線（人差し指と親指の間から手平横方向へ）: 青色の曲線
- 感情線（小指側から人差し指方向への横線）: 黄〜金色の曲線
- 運命線（手首中央から中指へ向かう縦線）: 緑色の曲線

各線に日本語のラベル（生命線、知能線、感情線、運命線）を優雅なフォントで添えてください。
元の手の写真はそのまま保持し、線のみをオーバーレイとして追加してください。`;

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

    if (!analysis.is_valid) {
      return NextResponse.json({
        error: "手のひらが鮮明に写っていないため鑑定できませんでした。手のひらを広げ、明るい場所で撮影してください。"
      }, { status: 422 });
    }

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
