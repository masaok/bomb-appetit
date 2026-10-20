import { describe, expect, it } from "vitest";
import { parseFrontMatter } from "./files";

describe("parseFrontMatter", () => {
  it("reads one-line values", () => {
    const { data, body } = parseFrontMatter(
      '---\ntitle: "T"\ntags: ["a", "b"]\ndraft: false\nlength: full\n---\nBody',
      "x.md",
    );
    expect(data).toEqual({ title: "T", tags: ["a", "b"], draft: false, length: "full" });
    expect(body).toBe("Body");
  });

  it("reads an array Prettier wrapped over several lines", () => {
    const wrapped =
      '---\nsecondaryKeywords:\n  [\n    "communication games for students",\n    "listening games for elementary students",\n  ]\ntags:\n  ["one", "two"]\n---\nBody';
    const { data } = parseFrontMatter(wrapped, "x.md");
    expect(data.secondaryKeywords).toEqual([
      "communication games for students",
      "listening games for elementary students",
    ]);
    expect(data.tags).toEqual(["one", "two"]);
  });

  it("rejects a line that is not key: value", () => {
    expect(() => parseFrontMatter("---\nnot a key\n---\nBody", "x.md")).toThrow("bad front matter line");
  });
});
