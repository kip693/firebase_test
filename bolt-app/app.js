const { App, LogLevel } = require("@slack/bolt");
const { startScheduledMessages } = require("./scheduled-messages");

const env = process.env.NODE_ENV || "development";

// 開発時は .env.development、本番は Fly.io の secrets から読み込み
require("dotenv").config({
  path: env === "development" ? ".env.development" : ".env",
});

const isDev = env === "development";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: isDev ? LogLevel.DEBUG : LogLevel.INFO,
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
    const http = require("http");
    http
      .createServer((_req, res) => {
        res.writeHead(200);
        res.end("ok");
      })
      .listen(3000);
  }
})();
