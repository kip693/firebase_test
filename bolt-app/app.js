import "dotenv/config";
import { App, LogLevel } from "@slack/bolt";
import { startScheduledMessages } from "./scheduled-messages.js";
import { handleReflectionReply } from "./reflection.js";

const env = process.env.NODE_ENV || "development";
const isDev = env === "development";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: isDev ? LogLevel.DEBUG : LogLevel.INFO,
});

// 振り返りスレッドへの返信を処理
app.message(async ({ message, say }) => {
  await handleReflectionReply({ message, say });
});

// メッセージイベント: "hello" に反応
app.message("hello", async ({ message, say }) => {
  await say(`Hey there <@${message.user}>! :wave:`);
});

// スラッシュコマンド: /ping
app.command("/ping", async ({ ack, respond }) => {
  await ack();
  await respond("Pong! :table_tennis_paddle_and_ball:");
});

// アプリのメンション
app.event("app_mention", async ({ event, say }) => {
  await say(`Hi <@${event.user}>! How can I help?`);
});

(async () => {
  await app.start();
  console.log(`⚡ Bolt app is running in Socket Mode! [${env}]`);

  // 定期メッセージの開始
  const channel = process.env.SLACK_CHANNEL_ID;
  if (channel) {
    startScheduledMessages(app, channel);
  } else {
    console.warn("[scheduler] SLACK_CHANNEL_ID が未設定のためスキップ");
  }

  // Fly.io ヘルスチェック用（本番のみ）
  if (!isDev) {
    const http = await import("http");
    http
      .createServer((_req, res) => {
        res.writeHead(200);
        res.end("ok");
      })
      .listen(3000);
  }
})();
