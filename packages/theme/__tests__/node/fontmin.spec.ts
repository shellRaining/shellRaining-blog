import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import { subsetFont, getAllChars } from "../../src/node/fontmin";
import subsetFontKit from "subset-font";

// Mock 外部依赖
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("subset-font", () => ({
  default: vi.fn(),
}));

describe("getAllChars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应该返回空集合当传入空数组时", () => {
    const result = getAllChars([]);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("应该正确收集单个文件中的所有字符", () => {
    // 模拟文件内容
    vi.mocked(fs.readFileSync).mockReturnValueOnce("Hello, 世界!");

    const result = getAllChars(["/path/to/file.md"]);

    // 验证 readFileSync 被正确调用
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/file.md", "utf-8");

    // 验证结果
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(9); // 'H','e','l','o',',',' ','世','界','!'
    expect(result.has("H")).toBe(true);
    expect(result.has("世")).toBe(true);
    expect(result.has("!")).toBe(true);
  });

  it("应该正确收集多个文件中的所有不重复字符", () => {
    // 模拟多个文件内容
    vi.mocked(fs.readFileSync)
      .mockReturnValueOnce("Hello")
      .mockReturnValueOnce("World")
      .mockReturnValueOnce("!");

    const result = getAllChars([
      "/path/to/file1.md",
      "/path/to/file2.md",
      "/path/to/file3.md",
    ]);

    // 验证 readFileSync 被正确调用了三次
    expect(fs.readFileSync).toHaveBeenCalledTimes(3);

    // 验证结果
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(8); // 'H','e','l','o','W','r','d','!'
    expect(result.has("H")).toBe(true);
    expect(result.has("W")).toBe(true);
    expect(result.has("!")).toBe(true);
  });

  it("应该正确处理包含特殊字符和多字节字符的文件", () => {
    // 模拟包含特殊字符和多字节字符的文件内容
    vi.mocked(fs.readFileSync).mockReturnValueOnce("你好，世界!\n\t\r");

    const result = getAllChars(["/path/to/file.md"]);

    // 验证结果
    expect(result.has("你")).toBe(true);
    expect(result.has("好")).toBe(true);
    expect(result.has("，")).toBe(true);
    expect(result.has("\n")).toBe(true);
    expect(result.has("\t")).toBe(true);
    expect(result.has("\r")).toBe(true);
  });

  it("应该在文件读取错误时抛出异常", () => {
    // 模拟文件读取失败
    vi.mocked(fs.readFileSync).mockImplementationOnce(() => {
      throw new Error("无法读取文件");
    });

    // 验证异常是否被正确抛出
    expect(() => getAllChars(["/path/to/nonexistent.md"])).toThrow(
      "无法读取文件",
    );
  });
});

describe("subsetFont", () => {
  const mockFontBuffer = Buffer.from("mockFontData");
  const mockSubsetBuffer = new Uint8Array([1, 2, 3, 4]);

  beforeEach(() => {
    vi.resetAllMocks();

    (fs.readFileSync as any).mockReturnValue(mockFontBuffer);
    (subsetFontKit as any).mockResolvedValue(mockSubsetBuffer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("应该成功子集化字体", async () => {
    const result = await subsetFont(
      "/path/to/source.ttf",
      "/path/to/output.woff2",
      "Hello World",
    );

    expect(fs.mkdirSync).toHaveBeenCalledWith("/path/to", { recursive: true });
    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/source.ttf");
    expect(subsetFontKit).toHaveBeenCalledWith(mockFontBuffer, "Hello World", {
      targetFormat: "woff2",
    });
    expect(result).toEqual(mockSubsetBuffer);
  });

  it("当输入文本为空字符串时应返回原始字体", async () => {
    const result = await subsetFont(
      "/path/to/source.ttf",
      "/path/to/output.woff2",
      "",
    );

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/source.ttf");
    expect(subsetFontKit).not.toHaveBeenCalled();
    expect(result).toEqual(new Uint8Array(mockFontBuffer.buffer));
  });

  it("当目标文件扩展名为 ttf 时应使用 truetype 格式", async () => {
    await subsetFont("/path/to/source.ttf", "/path/to/output.ttf", "Hello");

    expect(subsetFontKit).toHaveBeenCalledWith(mockFontBuffer, "Hello", {
      targetFormat: "truetype",
    });
  });

  it("当目标文件扩展名为woff时应使用woff格式", async () => {
    await subsetFont("/path/to/source.ttf", "/path/to/output.woff", "Hello");

    expect(subsetFontKit).toHaveBeenCalledWith(mockFontBuffer, "Hello", {
      targetFormat: "woff",
    });
  });

  it("当目标文件扩展名为 sfnt 时应使用 sfnt 格式", async () => {
    await subsetFont("/path/to/source.ttf", "/path/to/output.sfnt", "Hello");

    expect(subsetFontKit).toHaveBeenCalledWith(mockFontBuffer, "Hello", {
      targetFormat: "sfnt",
    });
  });

  it("当缺少参数时应抛出错误", async () => {
    await expect(subsetFont("", "/path/to/dest.woff2", "text")).rejects.toThrow(
      "src、dest 和 text 参数都必须提供",
    );

    await expect(subsetFont("/path/to/src.ttf", "", "text")).rejects.toThrow(
      "src、dest 和 text 参数都必须提供",
    );

    await expect(
      subsetFont("/path/to/src.ttf", "/path/to/dest.woff2", undefined as any),
    ).rejects.toThrow("src、dest 和 text 参数都必须提供");
  });

  it("当目标文件扩展名不支持时应抛出错误", async () => {
    await expect(
      subsetFont("/path/to/src.ttf", "/path/to/dest.jpg", "Hello"),
    ).rejects.toThrow("目标文件扩展名 jpg 不支持");
  });

  it("当读取源文件失败时应抛出错误", async () => {
    (fs.readFileSync as any).mockImplementation(() => {
      throw new Error("读取文件失败");
    });

    await expect(
      subsetFont("/path/to/src.ttf", "/path/to/dest.woff2", "Hello"),
    ).rejects.toThrow("字体子集化失败: Error: 读取文件失败");
  });

  it("当子集化处理失败时应抛出错误", async () => {
    (subsetFontKit as any).mockRejectedValue(new Error("子集化处理失败"));

    await expect(
      subsetFont("/path/to/src.ttf", "/path/to/dest.woff2", "Hello"),
    ).rejects.toThrow("字体子集化失败: Error: 子集化处理失败");
  });
});
