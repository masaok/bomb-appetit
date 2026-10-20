import { Marked, type Token, type Tokens } from "marked";

export type Heading = { depth: number; text: string; id: string };
export type Section = {
  heading: Heading;
  /** The first block under the heading, when it is a paragraph. */
  opener: string | null;
  prose: string;
};
export type Link = { href: string; text: string };
export type Image = { src: string; alt: string };

export type ParsedBody = {
  /** Second-level headings: the table of contents and the section list. */
  headings: Heading[];
  topLevelHeadings: number;
  firstParagraph: string;
  sections: Section[];
  prose: string;
  links: Link[];
  images: Image[];
};

/** The anchor a heading gets. The table of contents and the renderer both use it. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s-]+/g, "-");
}

export const countWords = (text: string) => text.match(/[A-Za-z0-9$%][A-Za-z0-9'’.,%$-]*/g)?.length ?? 0;

type WithTokens = Token & { tokens?: Token[] };

function inlineText(tokens: Token[] | undefined): string {
  if (!tokens) return "";
  return tokens
    .map((t) => {
      if (t.type === "image") return "";
      if (t.type === "br") return " ";
      const nested = (t as WithTokens).tokens;
      if (nested) return inlineText(nested);
      return "text" in t ? String(t.text) : "";
    })
    .join("");
}

// Prose only: headings, paragraphs, lists, tables and quotes, never code or HTML
function blockText(token: Token): string {
  switch (token.type) {
    case "heading":
    case "paragraph":
      return inlineText((token as WithTokens).tokens);
    case "list":
      return (token as Tokens.List).items.map((item) => item.tokens.map(blockText).join(" ")).join(" ");
    case "text":
      return (token as WithTokens).tokens ? inlineText((token as WithTokens).tokens) : token.text;
    case "blockquote":
      return (token as Tokens.Blockquote).tokens.map(blockText).join(" ");
    case "table": {
      const table = token as Tokens.Table;
      const cells = [...table.header, ...table.rows.flat()];
      return cells.map((cell) => inlineText(cell.tokens)).join(" ");
    }
    default:
      return "";
  }
}

function collect(tokens: Token[], links: Link[], images: Image[]) {
  for (const t of tokens) {
    if (t.type === "link") links.push({ href: t.href, text: inlineText((t as WithTokens).tokens) });
    if (t.type === "image") images.push({ src: t.href, alt: t.text });
    const nested = (t as WithTokens).tokens;
    if (nested) collect(nested, links, images);
    if (t.type === "list") for (const item of (t as Tokens.List).items) collect(item.tokens, links, images);
    if (t.type === "table") {
      const table = t as Tokens.Table;
      for (const cell of [...table.header, ...table.rows.flat()]) collect(cell.tokens, links, images);
    }
  }
}

const lexer = new Marked();

export function parseBody(body: string): ParsedBody {
  const tokens = lexer.lexer(body);
  const headings: Heading[] = [];
  const sections: Section[] = [];
  const links: Link[] = [];
  const images: Image[] = [];
  const prose: string[] = [];
  let topLevelHeadings = 0;
  let firstParagraph = "";
  let current: (Section & { parts: string[]; started: boolean }) | null = null;

  collect(tokens, links, images);

  for (const t of tokens) {
    if (t.type === "space" || t.type === "hr") continue;
    const text = blockText(t);
    if (text) prose.push(text);
    if (t.type === "heading") {
      const heading = t as Tokens.Heading;
      if (heading.depth === 1) topLevelHeadings += 1;
      if (heading.depth === 2) {
        const plain = inlineText(heading.tokens);
        const h = { depth: 2, text: plain, id: slugifyHeading(plain) };
        headings.push(h);
        if (current)
          sections.push({ heading: current.heading, opener: current.opener, prose: current.parts.join(" ") });
        current = { heading: h, opener: null, prose: "", parts: [], started: false };
        continue;
      }
    }
    if (!current) {
      if (!firstParagraph && t.type === "paragraph") firstParagraph = text;
      continue;
    }
    if (!current.started) {
      current.started = true;
      if (t.type === "paragraph") current.opener = text;
    }
    if (text) current.parts.push(text);
  }
  if (current)
    sections.push({ heading: current.heading, opener: current.opener, prose: current.parts.join(" ") });

  return { headings, topLevelHeadings, firstParagraph, sections, prose: prose.join(" "), links, images };
}

const renderer = new Marked({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const id = slugifyHeading(inlineText(tokens));
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
    link({ href, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      return external
        ? `<a href="${href}" rel="noopener noreferrer">${inner}</a>`
        : `<a href="${href}">${inner}</a>`;
    },
  },
});

/** The body as HTML. Tables are wrapped so they scroll instead of widening the page. */
export function renderBody(body: string): string {
  const html = renderer.parse(body, { async: false });
  return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
}
