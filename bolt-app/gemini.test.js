jest.mock("@google/generative-ai", () => {
  const mockText = jest.fn().mockReturnValue("## 今日の成果\n- テスト完了");
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: { text: mockText },
  });
  const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    _mocks: { mockGenerateContent, mockText },
  };
});

const { summarizeReflection } = require("./gemini");
const { _mocks } = require("@google/generative-ai");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("summarizeReflection", () => {
  test("Gemini APIにユーザーテキストを渡して結果を返す", async () => {
    const result = await summarizeReflection("今日はAPIの実装をした");

    expect(_mocks.mockGenerateContent).toHaveBeenCalledWith(
      "今日はAPIの実装をした"
    );
    expect(result).toBe("## 今日の成果\n- テスト完了");
  });

  test("APIエラー時に例外がスローされる", async () => {
    _mocks.mockGenerateContent.mockRejectedValueOnce(
      new Error("API quota exceeded")
    );

    await expect(summarizeReflection("テスト")).rejects.toThrow(
      "API quota exceeded"
    );
  });
});
