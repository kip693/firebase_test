import cron from "node-cron";
import { sendReflectionPrompt } from "./reflection.js";

/**
 * 定期メッセージのスケジュール定義
 * cron書式: 秒(任意) 分 時 日 月 曜日
 * タイムゾーン: Asia/Tokyo
 */
export const schedules = [
  {
    name: "朝の挨拶",
    cron: "0 9 * * 1-5", // 平日 9:00
    message: "おはようございます :sunny: 今日も一日頑張りましょう！",
  },
  {
    name: "お昼のリマインド",
    cron: "0 12 * * 1-5", // 平日 12:00
    message: "お昼休みです :bento: しっかり休憩しましょう！",
  },
];

export function startScheduledMessages(app, channel) {
  // 定型メッセージのスケジュール
  for (const schedule of schedules) {
    cron.schedule(
      schedule.cron,
      async () => {
        try {
          await app.client.chat.postMessage({
            channel,
            text: schedule.message,
          });
          console.log(`[scheduler] Sent: ${schedule.name}`);
        } catch (error) {
          console.error(`[scheduler] Failed: ${schedule.name}`, error.message);
        }
      },
      { timezone: "Asia/Tokyo" }
    );
    console.log(`[scheduler] Registered: ${schedule.name} (${schedule.cron})`);
  }

  // 18:00 振り返りプロンプト
  cron.schedule(
    "0 18 * * 1-5",
    async () => {
      await sendReflectionPrompt(app, channel);
    },
    { timezone: "Asia/Tokyo" }
  );
  console.log("[scheduler] Registered: 振り返りプロンプト (0 18 * * 1-5)");
}
