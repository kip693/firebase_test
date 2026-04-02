const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `あなたは優秀なワークコーチです。
ユーザーの今日の振り返りを受け取り、以下のフォーマットで整理してください。

## 今日の成果
- （ユーザーの報告から成果を箇条書きでまとめる）

## 課題・気づき
- （課題や困ったこと、気づきをまとめる）

## 明日のアクションプラン
1. （具体的で実行可能なタスクを3〜5個提案する）

簡潔で実用的にまとめてください。日本語で回答してください。`,
});

async function summarizeReflection(userText) {
  const result = await model.generateContent(userText);
  return result.response.text();
}

module.exports = { summarizeReflection };
