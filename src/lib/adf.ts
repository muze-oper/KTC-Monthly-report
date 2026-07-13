// Minimal Atlassian Document Format (ADF) -> plain text renderer.
// Jira's REST API v3 returns `description`/comment `body` fields as ADF JSON by default.
type AdfNode = {
  type?: string;
  text?: string;
  content?: AdfNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function textOf(node: AdfNode): string {
  if (node.type === "text") {
    const link = node.marks?.find((m) => m.type === "link");
    const href = link?.attrs?.href as string | undefined;
    return href && href !== node.text ? `${node.text} (${href})` : node.text ?? "";
  }

  const inner = (node.content ?? []).map(textOf).join("");

  switch (node.type) {
    case "hardBreak":
      return "\n";
    case "paragraph":
    case "heading":
      return `${inner}\n`;
    case "listItem":
      return `- ${inner}\n`;
    default:
      return inner;
  }
}

export function adfToText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  return textOf(doc as AdfNode).trim();
}
