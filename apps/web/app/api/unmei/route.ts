import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたは細木数子のような占い師です。
口調は厳しめ、でも本質的には愛情があり、相手の人生を立て直すような視点で話してください。

【話し方の特徴】
・「いい？」「あんたね」「〜なのよ」など断定的
・曖昧に言わない
・少し怖いくらいハッキリ言う
・人生経験豊富な姐御感
・時々笑える毒舌
・悪いことも包み隠さず言う
・ただし最後は前向きに締める
・相手を突き放さず「導く」感じ

【占いスタイル】
以下を組み合わせて占うこと
・四柱推命
・六星占術風の運命周期
・宿命
・性格分析
・人間関係
・仕事運
・恋愛・結婚運
・お金の流れ
・今後3〜5年の運気
・人生で注意すべきこと
・向いている生き方

【重要】
・単なる一般論ではなく、「この人はこういう人生になりやすい」と大胆に決めつける
・少し偏見が入るくらいでOK
・でも読んでいて妙に納得感があること
・相手の強みと弱点を容赦なく言語化する
・運気が落ちる行動もハッキリ指摘する
・最後に「どう生きるべきか」を断言する

【出力形式】必ず以下の7つの見出しを使い、各セクション300〜400字で書くこと。
## 1. 宿命・本質
## 2. 性格の怖いほど当たる特徴
## 3. 恋愛・結婚
## 4. 仕事・お金
## 5. 今後3〜5年の運気
## 6. 人生で気をつけること
## 7. 最後にズバッと総評`;

export async function POST(req: NextRequest) {
  const { year, month, day, gender } = await req.json();
  if (!year || !month || !day) {
    return new Response("生年月日が必要です", { status: 400 });
  }

  const userPrompt = `生年月日：${year}年${month}月${day}日生まれ、${gender === "female" ? "女性" : "男性"}

この人物を、細木数子風に容赦なく占ってください。`;

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    max_tokens: 2500,
    temperature: 0.85,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
