// Build a plain-text preview from a post's raw markdown body.
// Sätteri doesn't expose an excerpt, so strip the common markdown syntax and take the
// first `wordCount` words. `entry.body` already excludes the YAML frontmatter.
export function getExcerpt(markdown = "", wordCount = 45) {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")      // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // links -> link text
    .replace(/^#{1,6}\s+/gm, "")               // headings
    .replace(/^>\s?/gm, "")                    // blockquotes
    .replace(/```[\s\S]*?```/g, "")            // fenced code blocks
    .replace(/`([^`]*)`/g, "$1")               // inline code
    .replace(/^\s*[-*+]\s+/gm, "")             // list bullets
    .replace(/[*_~]/g, "")                     // emphasis markers
    .replace(/\s+/g, " ")                      // collapse whitespace
    .trim();

  const words = text.split(" ").filter(Boolean);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "…";
}
