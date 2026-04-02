import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

import { summarizeReflection } from "./gemini.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateContent.mockResolvedValue({
    response: { text: () => "## 今日の成果\n- テスト完了" },
  });
});

describe("summarizeReflection", () => {
  test("Gemini APIにユーザーテキストを渡して結果を返す", async () => {
    const result = await summarizeReflection("今日はAPIの実装をした");

    expect(mockGenerateContent).toHaveBeenCalledWith("今日はAPIの実装をした");
    expect(result).toBe("## 今日の成果\n- テスト完了");
  });

  test("APIエラー時に例外がスローされる", async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error("API quota exceeded")
    );

    await expect(summarizeReflection("テスト")).rejects.toThrow(
      "API quota exceeded"
    );
  });
});
