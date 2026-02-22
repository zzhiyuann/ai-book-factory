/**
 * Lightweight client-side Markdown to HTML converter.
 * No dependencies — good enough for book rendering.
 */
export function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities in code blocks first
  const codeBlocks: string[] = [];
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Headers
  html = html.replace(/^#{1} (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^#{2} (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#{3} (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^#{4} (.+)$/gm, "<h4>$1</h4>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Paragraphs (lines that aren't already wrapped)
  html = html.replace(/^(?!<[hublop]|<\/|<hr|__CODE)(.+)$/gm, "<p>$1</p>");

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    const lang = block.match(/```(\w+)/)?.[1] || "";
    const code = block.replace(/```\w*\n?/, "").replace(/\n?```$/, "");
    html = html.replace(
      `__CODE_BLOCK_${i}__`,
      `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
    );
  });

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
