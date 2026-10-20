// Reads the post files the private package holds in content/blog, and the keyword map in
// docs/blog-keywords.md, as scripts/sync-cloud.mjs syncs them into .cloud/. Node-only: the
// seed, the content check and the content test use it, the pages never do. With the public
// stub there are no files, and listPostFiles() is empty.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postInputSchema, type PostInput } from "./schema";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CONTENT_DIR = path.join(appDir, ".cloud", "content", "blog");
export const KEYWORD_MAP_FILE = path.join(appDir, ".cloud", "docs", "blog-keywords.md");

// Front matter is strict on purpose: `key: value` per line, where a value is a
// JSON string or array, true/false, or a bare word. Prettier wraps a long array over
// several lines, so an array may continue until its brackets balance.
export function parseFrontMatter(raw: string, file: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing front matter`);
  const data: Record<string, unknown> = {};
  const lines = match[1]!.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!m) throw new Error(`${file}: bad front matter line "${line}"`);
    const key = m[1]!;
    let value = m[2]!.trim();
    // A wrapped array: gather lines until the brackets balance
    if (value === "" || (value.startsWith("[") && !value.endsWith("]"))) {
      const depth = (text: string) => (text.match(/\[/g)?.length ?? 0) - (text.match(/\]/g)?.length ?? 0);
      while (i + 1 < lines.length && (value === "" || depth(value) > 0)) {
        i += 1;
        value = `${value} ${lines[i]!.trim()}`.trim();
      }
      value = value.replace(/,\s*\]/g, "]");
    }
    if (value === "true" || value === "false") data[key] = value === "true";
    else if (value.startsWith("[") || value.startsWith('"')) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        throw new Error(`${file}: ${key} is not valid JSON: ${value}`);
      }
    } else if (value) data[key] = value;
  }
  return { data, body: match[2]!.trim() };
}

export function readPostFile(slug: string): PostInput {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  const { data, body } = parseFrontMatter(readFileSync(file, "utf8"), file);
  const result = postInputSchema.safeParse({ ...data, slug, body });
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".") || "post"}: ${i.message}`).join("; ");
    throw new Error(`${slug}.md: ${issues}`);
  }
  return result.data;
}

export function listPostFiles(): string[] {
  try {
    return readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .map((f) => f.slice(0, -3))
      .sort();
  } catch {
    return [];
  }
}

/** Rows of docs/blog-keywords.md: keyword and slug, for the check's subset mode. */
export function readKeywordMap(): { keyword: string; slug: string; category: string; status: string }[] {
  let raw: string;
  try {
    raw = readFileSync(KEYWORD_MAP_FILE, "utf8");
  } catch {
    return [];
  }
  const lines = raw.split("\n").filter((l) => l.startsWith("|"));
  const header = lines[0]?.split("|").map((c) => c.trim().toLowerCase());
  if (!header) return [];
  const col = (name: string) => header.indexOf(name);
  const [k, s, c, st] = [col("keyword"), col("slug"), col("category"), col("status")];
  return lines
    .slice(2)
    .map((l) => l.split("|").map((cell) => cell.trim()))
    .filter((cells) => cells[k] && cells[s] && !/^-+$/.test(cells[k]!))
    .map((cells) => ({
      keyword: cells[k]!,
      slug: cells[s]!.replace(/`/g, ""),
      category: cells[c] ?? "",
      status: cells[st] ?? "",
    }));
}
