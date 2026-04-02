import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSummarizeReflection } = vi.hoisted(() => ({
  mockSummarizeReflection: vi.fn(),
}));

vi.mock("./gemini.js", () => ({
  summarizeReflection: mockSummarizeReflection,
}));

import {
  sendReflectionPrompt,
  isReflectionThread,
  handleReflectionReply,
} from "./reflection.js";

afterEach(() => {
  vi.clearAllMocks();
});

function createMockApp(ts = "1234567890.000100") {
  return {
    client: {
      chat: {
        postMessage: vi.fn().mockResolvedValue({ ok: true, ts }),
      },
    },
  };
}

describe("sendReflectionPrompt", () => {
  test("チャンネルに振り返りプロンプトを投稿し、thread_tsを追跡する", async () => {
    const app = createMockApp("1111.0001");

    await sendReflectionPrompt(app, "C_TEST");

    expect(app.client.chat.postMessage).toHaveBeenCalledWith({
      channel: "C_TEST",
      text: expect.stringContaining("振り返り"),
    });
    expect(isReflectionThread("1111.0001")).toBe(true);
  });

  test("投稿失敗時にもクラッシュしない", async () => {
    const app = createMockApp();
    app.client.chat.postMessage.mockRejectedValueOnce(
      new Error("channel_not_found")
    );

    await expect(sendReflectionPrompt(app, "C_BAD")).resolves.toBeUndefined();
  });
});

describe("isReflectionThread", () => {
  test("追跡していないthread_tsにはfalseを返す", () => {
    expect(isReflectionThread("9999.9999")).toBe(false);
  });
});

describe("handleReflectionReply", () => {
  const threadTs = "2222.0002";

  beforeEach(async () => {
    const app = createMockApp(threadTs);
    await sendReflectionPrompt(app, "C_TEST");
  });

  test("振り返りスレッドへの返信を処理し、Geminiの要約を投稿する", async () => {
    mockSummarizeReflection.mockResolvedValueOnce("## 今日の成果\n- テスト");
    const say = vi.fn();

    const result = await handleReflectionReply({
      message: { thread_ts: threadTs, text: "今日はテストを書いた", ts: "2222.0003" },
      say,
    });

    expect(result).toBe(true);
    expect(say).toHaveBeenCalledTimes(2);
    expect(say).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("まとめています")
    );
    expect(say).toHaveBeenNthCalledWith(2, "## 今日の成果\n- テスト");
    expect(isReflectionThread(threadTs)).toBe(false);
  });

  test("関係ないスレッドへの返信はfalseを返す", async () => {
    const say = vi.fn();

    const result = await handleReflectionReply({
      message: { thread_ts: "9999.9999", text: "hello", ts: "9999.0001" },
      say,
    });

    expect(result).toBe(false);
    expect(say).not.toHaveBeenCalled();
  });

  test("thread_tsがないメッセージはfalseを返す", async () => {
    const say = vi.fn();

    const result = await handleReflectionReply({
      message: { text: "hello", ts: "3333.0001" },
      say,
    });

    expect(result).toBe(false);
    expect(say).not.toHaveBeenCalled();
  });

  test("Botのメッセージは無視する（trueを返すが処理しない）", async () => {
    const say = vi.fn();

    const result = await handleReflectionReply({
      message: { thread_ts: threadTs, bot_id: "B123", ts: "2222.0004" },
      say,
    });

    expect(result).toBe(true);
    expect(say).not.toHaveBeenCalled();
    expect(isReflectionThread(threadTs)).toBe(true);
  });

  test("Gemini APIエラー時にエラーメッセージを投稿する", async () => {
    mockSummarizeReflection.mockRejectedValueOnce(new Error("API error"));
    const say = vi.fn();

    const result = await handleReflectionReply({
      message: { thread_ts: threadTs, text: "振り返り内容", ts: "2222.0005" },
      say,
    });

    expect(result).toBe(true);
    expect(say).toHaveBeenCalledTimes(2);
    expect(say).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("失敗しました")
    );
  });
});
