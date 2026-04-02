import { summarizeReflection } from "./gemini.js";

// Botが投稿した振り返りスレッドの thread_ts を追跡
const activeThreads = new Set();

const REFLECTION_PROMPT = `:memo: お疲れ様です！今日の振り返りをお願いします。

以下の点をスレッドで教えてください：
• 今日やったこと
• うまくいったこと
• 困ったこと・課題
• 明日やりたいこと（あれば）`;

export async function sendReflectionPrompt(app, channel) {
  try {
    const result = await app.client.chat.postMessage({
      channel,
      text: REFLECTION_PROMPT,
    });
    activeThreads.add(result.ts);
    console.log(`[reflection] Prompt sent (thread_ts: ${result.ts})`);
  } catch (error) {
    console.error("[reflection] Failed to send prompt:", error.message);
  }
}

export function isReflectionThread(threadTs) {
  return activeThreads.has(threadTs);
}

export async function handleReflectionReply({ message, say }) {
  const threadTs = message.thread_ts;
  if (!threadTs || !activeThreads.has(threadTs)) {
    return false;
  }

  // Bot自身のメッセージは無視
  if (message.subtype === "bot_message" || message.bot_id) {
    return true;
  }

  activeThreads.delete(threadTs);

  await say(":hourglass: 振り返りをまとめています...");

  try {
    const summary = await summarizeReflection(message.text);
    await say(summary);
    console.log(`[reflection] Summary sent (thread_ts: ${threadTs})`);
  } catch (error) {
    console.error("[reflection] Gemini API error:", error.message);
    await say(
      ":warning: 申し訳ありません、まとめの生成に失敗しました。後でもう一度お試しください。"
    );
  }

  return true;
}
