import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// APIキーはサーバー側でだけ使う。クライアントには絶対に出さない。
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `あなたはダンスの動きを言葉で説明するコーチです。
渡された連続する3枚の静止画（区間の開始・中間・終了）を見て、その区間で踊り手が何をしているかを日本語で説明してください。

必ず以下の見出しをこの順番で、各1〜2文で書いてください:

体の向き:
足のステップ:
腕・手の動き:
頭・目線:
コツ:

ルール:
- 振り付けの正式名称（技名・ステップ名）は無理に当てないでください。見たままを言語化してください。
- 画像から判断できない項目は、推測せずに「判別しづらい」とだけ書いてください。
- 「コツ」は、その区間を練習するときに意識すべきことを一言で書いてください。
- 見出し以外の前置き・まとめ・箇条書き記号は書かないでください。`;

type AnalyzeRequest = {
  images?: unknown;
  label?: unknown;
  startTime?: unknown;
  endTime?: unknown;
};

/** data URL（data:image/jpeg;base64,xxxx）から base64 部分だけを取り出す */
function toBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY が設定されていません。プロジェクト直下に .env.local を作り、キーを設定してから dev サーバーを再起動してください。",
      },
      { status: 500 },
    );
  }

  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const images = body.images;
  if (!Array.isArray(images) || images.length === 0 || !images.every((i) => typeof i === "string")) {
    return NextResponse.json({ error: "画像が渡されていません。" }, { status: 400 });
  }
  if (images.length > 5) {
    return NextResponse.json({ error: "画像は最大5枚までです。" }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label : "この区間";
  const startTime = typeof body.startTime === "number" ? body.startTime : 0;
  const endTime = typeof body.endTime === "number" ? body.endTime : 0;
  const positions = ["開始", "中間", "終了"];

  // 画像ブロックと、それぞれが区間内のどの位置かを示すラベルを交互に並べる
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `${label}（${startTime.toFixed(1)}秒〜${endTime.toFixed(1)}秒）の3枚です。`,
    },
  ];

  images.forEach((image, i) => {
    content.push({ type: "text", text: `【${positions[i] ?? `${i + 1}枚目`}】` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: toBase64(image as string) },
    });
  });

  content.push({
    type: "text",
    text: "この区間の動きを、指定の形式で説明してください。",
  });

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const description = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!description) {
      return NextResponse.json({ error: "解説を生成できませんでした。" }, { status: 502 });
    }

    return NextResponse.json({ description });
  } catch (error) {
    const message =
      error instanceof Anthropic.APIError
        ? `Anthropic API エラー (${error.status}): ${error.message}`
        : error instanceof Error
          ? error.message
          : "不明なエラーが発生しました。";
    console.error("[analyze]", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
