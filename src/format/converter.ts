import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { log } from "../utils/logger.js";

const STYLES_DIR = join(dirname(dirname(dirname(import.meta.url.replace("file://", "")))), "styles");

function findStylesDir(): string {
  // Try multiple locations for the styles directory
  const candidates = [
    join(dirname(dirname(dirname(import.meta.url.replace("file://", "")))), "styles"),
    join(process.cwd(), "styles"),
    join(dirname(dirname(dirname(dirname(import.meta.url.replace("file://", ""))))), "styles"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "default.css"))) return c;
  }
  return candidates[0];
}

function loadCSS(styleName: string, customCSSPath?: string): string {
  let css = "";

  if (customCSSPath && existsSync(customCSSPath)) {
    css = readFileSync(customCSSPath, "utf-8");
  } else {
    const stylesDir = findStylesDir();
    const cssPath = join(stylesDir, `${styleName}.css`);
    if (existsSync(cssPath)) {
      css = readFileSync(cssPath, "utf-8");
    }
  }

  return css;
}

function hasPandoc(): boolean {
  try {
    execSync("pandoc --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function hasChrome(): string | null {
  const paths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Convert Markdown to HTML using pandoc (preferred) or marked (fallback).
 */
export async function mdToHtml(
  mdPath: string,
  styleName: string = "default",
  customCSSPath?: string
): Promise<string> {
  const basePath = mdPath.replace(/\.md$/, "");
  const htmlPath = basePath + ".html";
  const css = loadCSS(styleName, customCSSPath);

  if (hasPandoc()) {
    log.info("Converting MD → HTML via pandoc...");
    const rawHtml = execSync(
      `pandoc --standalone --metadata title=" " -f markdown -t html5 "${mdPath}"`,
      { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }
    );

    // Inject CSS inline for self-contained HTML
    const htmlWithCSS = css
      ? rawHtml.replace("</head>", `<style>\n${css}\n</style>\n</head>`)
      : rawHtml;

    writeFileSync(htmlPath, htmlWithCSS, "utf-8");
  } else {
    log.info("Converting MD → HTML via marked (pandoc not found)...");
    const { marked } = await import("marked");
    const mdContent = readFileSync(mdPath, "utf-8");
    const htmlBody = await marked(mdContent);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${css ? `<style>\n${css}\n</style>` : ""}
</head>
<body>
${htmlBody}
</body>
</html>`;

    writeFileSync(htmlPath, html, "utf-8");
  }

  log.success(`HTML saved: ${htmlPath}`);
  return htmlPath;
}

/**
 * Convert HTML to PDF using Chrome headless.
 */
export function htmlToPdf(htmlPath: string): string | null {
  const chromePath = hasChrome();
  if (!chromePath) {
    log.warn("Chrome not found — skipping PDF generation.");
    return null;
  }

  const pdfPath = htmlPath.replace(/\.html$/, ".pdf");
  log.info("Converting HTML → PDF via Chrome headless...");

  try {
    execSync(
      `"${chromePath}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "file://${htmlPath}"`,
      { stdio: "ignore", timeout: 60000 }
    );
    log.success(`PDF saved: ${pdfPath}`);
    return pdfPath;
  } catch (err) {
    log.warn("PDF generation failed — continuing without PDF.");
    return null;
  }
}

/**
 * Run the full format pipeline: MD → HTML (→ PDF if requested).
 */
export async function formatBook(
  mdPath: string,
  options: {
    outputs: string[];
    style: string;
    customCSS?: string;
  }
): Promise<{ html?: string; pdf?: string }> {
  const result: { html?: string; pdf?: string } = {};

  if (options.outputs.includes("html") || options.outputs.includes("pdf")) {
    result.html = await mdToHtml(mdPath, options.style, options.customCSS);
  }

  if (options.outputs.includes("pdf") && result.html) {
    result.pdf = htmlToPdf(result.html) ?? undefined;
  }

  return result;
}
