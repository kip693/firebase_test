const { App } = require("@slack/bolt");
require("dotenv").config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
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
  console.log("⚡ Bolt app is running in Socket Mode!");
})();
